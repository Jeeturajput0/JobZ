import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, toObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import CandidateRecommendation from "@/models/CandidateRecommendation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage", "company.candidates.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "recommendation id");
    const recommendation = await CandidateRecommendation.findOne({ _id: id, companyId })
      .populate({ path: "candidateId", select: "fullName email" })
      .populate({ path: "jobId", select: "title" })
      .populate({ path: "hiringRequestId", select: "jobTitle" })
      .populate({ path: "counselorId", select: "fullName" })
      .lean();
    if (!recommendation) return fail("Recommendation not found for your company.", 404);
    return ok({ recommendation });
  } catch (error) {
    return handleError(error);
  }
}

const COMPANY_TRANSITIONS = ["companyReviewing", "shortlisted", "interviewScheduled", "selected", "rejected", "hired"];

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage", "company.candidates.shortlist"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "recommendation id");
    const recommendation = await CandidateRecommendation.findOne({ _id: id, companyId });
    if (!recommendation) return fail("Recommendation not found.", 404);
    if (recommendation.candidateConsent !== "accepted") {
      return fail("Candidate consent is required before reviewing this recommendation.", 403);
    }
    const body = await readJson(request);
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!COMPANY_TRANSITIONS.includes(status)) return fail("Invalid status for company review.", 400);
      recommendation.status = status;
      recommendation.timeline.push({ status, note: cleanString(body.note, 500), by: toObjectId(auth.session.userId)!, at: new Date() });
    }
    if (body.feedback !== undefined) {
      recommendation.companyFeedback = cleanString(body.feedback, 3000);
    }
    await recommendation.save();

    await logActivity({
      session: auth.session,
      action: "recommendation.updated",
      entity: "CandidateRecommendation",
      entityId: id,
      description: `Updated recommendation status to ${recommendation.status}.`,
    });
    await notify({
      userId: String(recommendation.counselorId),
      type: "recommendation.companyFeedback",
      title: "Company feedback on your recommendation",
      message: `A company updated a candidate recommendation to ${recommendation.status}.`,
      link: "/counseling/recommendations",
    });
    return ok({ recommendation });
  } catch (error) {
    return handleError(error);
  }
}
