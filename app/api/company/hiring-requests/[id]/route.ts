import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, toObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { HIRING_REQUEST_STATUSES } from "@/lib/constants";
import { logActivity } from "@/lib/notify";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "request id");
    const hiringRequest = await HiringRequest.findOne({ _id: id, companyId }).populate("assignedTo", "fullName email").lean();
    if (!hiringRequest) return fail("Hiring request not found.", 404);
    const recommendations = await CandidateRecommendation
      .find({ hiringRequestId: id })
      .populate("candidateId", "fullName email")
      .lean();
    return ok({ request: hiringRequest, recommendations });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "request id");
    const hiringRequest = await HiringRequest.findOne({ _id: id, companyId });
    if (!hiringRequest) return fail("Hiring request not found.", 404);
    const body = await readJson(request);
    const editable = [
      "jobTitle", "jobDescription", "educationRequirements", "experienceRequirements",
      "jobLocation", "salaryRange", "jobType", "preferredCandidateProfile", "additionalRequirements",
    ];
    for (const field of editable) {
      if (body[field] !== undefined) (hiringRequest as unknown as Record<string, unknown>)[field] = cleanString(body[field], 20000);
    }
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!HIRING_REQUEST_STATUSES.includes(status as never)) return fail("Invalid status.", 400);
      hiringRequest.status = status;
      hiringRequest.history.push({ status, note: cleanString(body.note, 500), by: toObjectId(auth.session.userId)!, at: new Date() });
    }
    if (body.feedback !== undefined) {
      hiringRequest.feedback.push({ by: toObjectId(auth.session.userId)!, note: cleanString(body.feedback, 2000), at: new Date() });
    }
    await hiringRequest.save();
    await logActivity({
      session: auth.session,
      action: "hiringRequest.updated",
      entity: "HiringRequest",
      entityId: id,
      description: "Updated a hiring request.",
    });
    return ok({ request: hiringRequest });
  } catch (error) {
    return handleError(error);
  }
}
