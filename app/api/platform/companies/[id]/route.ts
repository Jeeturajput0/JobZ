import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import Company from "@/models/Company";
import EmployerProfile from "@/models/EmployerProfile";
import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import CompanyMembership from "@/models/CompanyMembership";
import Partnership from "@/models/Partnership";
import Placement from "@/models/Placement";
import ActivityLog from "@/models/ActivityLog";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "company id");
    const company = await Company.findById(id)
      .populate({ path: "ownerId", select: "fullName email phone status" })
      .populate({ path: "employerProfileId" })
      .lean();
    if (!company) return fail("Company not found.", 404);

    const [jobs, applications, members, partnerships, placements, activity] = await Promise.all([
      Job.find({ $or: [{ companyId: id }, { employerId: company.ownerId?._id }] })
        .select("title status approvalStatus location jobType createdAt").sort({ createdAt: -1 }).limit(30).lean(),
      Application.find({ $or: [{ companyId: id }, { employerId: company.ownerId?._id }] })
        .select("status source appliedAt jobId jobSeekerId")
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "jobSeekerId", select: "fullName" })
        .sort({ appliedAt: -1 }).limit(30).lean(),
      CompanyMembership.find({ companyId: id })
        .populate({ path: "userId", select: "fullName email status" }).lean(),
      Partnership.find({ companyId: id })
        .populate({ path: "counselingTeamId", select: "name" }).sort({ createdAt: -1 }).lean(),
      Placement.find({ companyId: id })
        .populate({ path: "candidateId", select: "fullName" })
        .populate({ path: "jobId", select: "title" }).sort({ createdAt: -1 }).lean(),
      ActivityLog.find({ companyId: id }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    return ok({
      company,
      jobs,
      applications,
      members,
      partnerships,
      placements,
      activity,
      verificationHistory: (company.settings as Record<string, unknown> | undefined)?.verificationHistory || [],
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "company id");
    const company = await Company.findById(id);
    if (!company) return fail("Company not found.", 404);
    const body = await readJson(request);

    if (body.verificationStatus !== undefined) {
      const status = String(body.verificationStatus);
      if (!["pending", "verified", "rejected"].includes(status)) return fail("Invalid verification status.", 400);
      company.verificationStatus = status as "pending" | "verified" | "rejected";
      if (company.employerProfileId) {
        await EmployerProfile.findByIdAndUpdate(company.employerProfileId, { $set: { verificationStatus: status } });
      }
      const settings = (company.settings || {}) as Record<string, unknown>;
      const history = Array.isArray(settings.verificationHistory) ? settings.verificationHistory : [];
      history.push({
        status,
        note: cleanString(body.reason, 1000),
        by: auth.session.userId,
        at: new Date(),
      });
      settings.verificationHistory = history;
      company.settings = settings;
      await notify({
        userId: String(company.ownerId),
        type: "company.verification",
        title: "Company verification updated",
        message: `Your company verification status is now ${status}.${body.reason ? ` Reason: ${String(body.reason)}` : ""}`,
        link: "/company/profile",
      });
    }
    if (body.status !== undefined && ["active", "suspended"].includes(String(body.status))) {
      company.status = String(body.status) as "active" | "suspended";
    }
    const editable = ["name", "industry", "website", "description"] as const;
    for (const field of editable) {
      if (body[field] !== undefined) (company as unknown as Record<string, unknown>)[field] = cleanString(body[field], 5000);
    }
    await company.save();
    if (company.employerProfileId && (body.industry || body.website || body.description)) {
      const updates: Record<string, unknown> = {};
      if (body.industry) updates.industry = cleanString(body.industry, 100);
      if (body.website) updates.website = cleanString(body.website, 300);
      if (body.description) updates.description = cleanString(body.description, 5000);
      await EmployerProfile.findByIdAndUpdate(company.employerProfileId, { $set: updates });
    }
    await logActivity({
      session: auth.session,
      action: body.verificationStatus ? "company.verification.updated" : "company.updated",
      entity: "Company",
      entityId: id,
      description: `Updated company ${company.name}${body.verificationStatus ? ` verification to ${body.verificationStatus}` : ""}.`,
      metadata: { reason: cleanString(body.reason, 1000) },
    });
    return ok({ company });
  } catch (error) {
    return handleError(error);
  }
}
