import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, parsePagination, isObjectId, toObjectId, cleanString } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import Placement from "@/models/Placement";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.placements.manage", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ placements: [], total: 0 });
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { companyId };
    if (sp.get("status")) query.status = sp.get("status");
    const [placements, total] = await Promise.all([
      Placement.find(query)
        .populate({ path: "candidateId", select: "fullName email" })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "counselingTeamId", select: "name" })
        .populate({ path: "counselorId", select: "fullName" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Placement.countDocuments(query),
    ]);
    return ok({ placements, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** Records joining only from a selected/hired application owned by this company. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.placements.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);
    const body = await readJson(request);
    if (!isObjectId(body.applicationId)) return fail("A valid application is required.", 400);
    const application = await Application.findOne({ _id: body.applicationId, companyId });
    if (!application) return fail("Application not found for your company.", 404);
    if (!["selected", "offerReceived", "hired"].includes(application.status)) {
      return fail("Joining can only be recorded for a selected candidate.", 409);
    }
    if (!body.joiningDate || Number.isNaN(new Date(String(body.joiningDate)).getTime())) {
      return fail("A valid joining date is required.", 400);
    }
    const existing = await Placement.findOne({ applicationId: application._id });
    if (existing) return fail("A placement record already exists for this application.", 409);

    const placement = await Placement.create({
      candidateId: application.jobSeekerId,
      jobId: application.jobId,
      applicationId: application._id,
      recommendationId: application.recommendationId || null,
      companyId: toObjectId(companyId)!,
      counselingTeamId: null,
      counselorId: null,
      source: application.source === "recommendation" ? "counselingReferral" : "direct",
      status: "confirmed",
      joiningDate: new Date(String(body.joiningDate)),
      notes: cleanString(body.note, 3000),
      recordedBy: toObjectId(auth.session.userId),
      history: [{ status: "confirmed", note: "Joining confirmed by company", by: toObjectId(auth.session.userId), at: new Date() }],
    });
    application.status = "hired";
    application.timeline.push({ status: "hired", note: "Joining confirmed", by: toObjectId(auth.session.userId)!, at: new Date() });
    await application.save();

    await logActivity({ session: auth.session, action: "placement.confirmed", entity: "Placement", entityId: String(placement._id), description: "Confirmed a candidate joining." });
    await notify({ userId: String(application.jobSeekerId), type: "placement.confirmed", title: "Joining confirmed", message: "Your joining has been recorded by the company.", link: "/profile" });
    return created({ placement });
  } catch (error) {
    return handleError(error);
  }
}
