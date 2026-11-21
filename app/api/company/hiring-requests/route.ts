import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, parsePagination, clampNumber, toObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { HIRING_REQUEST_STATUSES } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import HiringRequest from "@/models/HiringRequest";
import User from "@/models/User";
import CounselingTeam from "@/models/CounselingTeam";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams, 20);
    const status = request.nextUrl.searchParams.get("status");
    const query: Record<string, unknown> = { companyId };
    if (status) query.status = status;
    const [requests, total] = await Promise.all([
      HiringRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("assignedTo", "fullName email").lean(),
      HiringRequest.countDocuments(query),
    ]);
    return ok({ requests, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);

    const body = await readJson(request);
    const jobTitle = cleanString(body.jobTitle, 180);
    if (!jobTitle) return fail("Job title is required.", 400);

    const status = String(body.status || "draft");
    const submit = status === "submitted";
    const deadline = body.hiringDeadline ? new Date(String(body.hiringDeadline)) : null;
    const hiringRequest = await HiringRequest.create({
      companyId,
      createdBy: auth.session.userId,
      jobTitle,
      jobDescription: cleanString(body.jobDescription, 20000),
      requiredSkills: cleanStringArray(body.requiredSkills, 50, 120),
      preferredSkills: cleanStringArray(body.preferredSkills, 50, 120),
      educationRequirements: cleanString(body.educationRequirements, 2000),
      experienceRequirements: cleanString(body.experienceRequirements, 2000),
      jobLocation: cleanString(body.jobLocation, 200),
      salaryRange: cleanString(body.salaryRange, 120),
      jobType: cleanString(body.jobType, 40) || "full-time",
      numberOfOpenings: clampNumber(body.numberOfOpenings, 1, 1000, 1),
      preferredCandidateProfile: cleanString(body.preferredCandidateProfile, 5000),
      hiringDeadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
      priority: (["low", "medium", "high", "urgent"].includes(String(body.priority)) ? String(body.priority) : "medium") as "low" | "medium" | "high" | "urgent",
      additionalRequirements: cleanString(body.additionalRequirements, 5000),
      status: HIRING_REQUEST_STATUSES.includes(status as never) ? status : "draft",
      history: [{ status: HIRING_REQUEST_STATUSES.includes(status as never) ? status : "draft", by: toObjectId(auth.session.userId)!, at: new Date() }],
    });

    await logActivity({
      session: auth.session,
      action: "hiringRequest.created",
      entity: "HiringRequest",
      entityId: String(hiringRequest._id),
      description: `Created hiring request for ${jobTitle}.`,
    });

    if (submit) {
      const teams = await CounselingTeam.find({ status: "active" }).select("adminId").lean();
      const recipients = teams.map((t) => String(t.adminId));
      const admins = await User.find({ role: "counselingAdmin", status: "active" }).select("_id").lean();
      recipients.push(...admins.map((a) => String(a._id)));
      await notify({
        userId: Array.from(new Set(recipients)),
        type: "hiringRequest.submitted",
        title: "New hiring request",
        message: `A company submitted a sourcing request for ${jobTitle}.`,
        link: "/counseling/hiring-requests",
      });
    }

    return created({ request: hiringRequest });
  } catch (error) {
    return handleError(error);
  }
}
