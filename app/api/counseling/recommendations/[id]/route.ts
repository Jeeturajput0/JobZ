import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, toObjectId, requireObjectId } from "@/lib/api";
import { RECOMMENDATION_STATUSES } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import CandidateRecommendation from "@/models/CandidateRecommendation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.recommendations.manage", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "recommendation id");
    const recommendation = await CandidateRecommendation.findOne({
      _id: id,
      counselingTeamId: auth.session.counselingTeamId,
    })
      .populate({ path: "candidateId", select: "fullName email" })
      .populate({ path: "companyId", select: "name" })
      .populate({ path: "jobId", select: "title" })
      .populate({ path: "hiringRequestId", select: "jobTitle" })
      .populate({ path: "counselorId", select: "fullName" }).lean();
    if (!recommendation) return fail("Recommendation not found.", 404);
    return ok({ recommendation });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.recommendations.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "recommendation id");
    const recommendation = await CandidateRecommendation.findOne({ _id: id, counselorId: auth.session.userId });
    if (!recommendation) return fail("Recommendation not found.", 404);
    const body = await readJson(request);
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!RECOMMENDATION_STATUSES.includes(status as never)) return fail("Invalid status.", 400);
      recommendation.status = status;
      recommendation.timeline.push({ status, note: cleanString(body.note, 500), by: toObjectId(auth.session.userId)!, at: new Date() });
    }
    if (body.note !== undefined && body.status === undefined) recommendation.note = cleanString(body.note, 3000);
    await recommendation.save();
    await logActivity({ session: auth.session, action: "recommendation.updated", entity: "CandidateRecommendation", entityId: id, description: "Updated a recommendation." });
    return ok({ recommendation });
  } catch (error) {
    return handleError(error);
  }
}
