import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, toObjectId, isObjectId, parsePagination } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import Placement from "@/models/Placement";
import CandidateRecommendation from "@/models/CandidateRecommendation";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.analytics.view", "counseling.dashboard.view", "counseling.recommendations.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    if (!auth.session.counselingTeamId) return ok({ placements: [], total: 0 });

    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { counselingTeamId: auth.session.counselingTeamId };
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("source")) query.source = sp.get("source");
    const [placements, total] = await Promise.all([
      Placement.find(query)
        .populate({ path: "candidateId", select: "fullName email" })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "counselorId", select: "fullName" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Placement.countDocuments(query),
    ]);
    return ok({ placements, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** Records a placement from an authorized recommendation. Joining must be confirmed separately. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.recommendations.manage", "counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    if (!auth.session.counselingTeamId) return fail("No counseling organization is linked to your account.", 403);
    const body = await readJson(request);
    if (!isObjectId(body.recommendationId)) return fail("A valid recommendation is required.", 400);
    const recommendation = await CandidateRecommendation.findOne({
      _id: body.recommendationId,
      counselingTeamId: auth.session.counselingTeamId,
    });
    if (!recommendation) return fail("Recommendation not found for your organization.", 404);
    if (!["selected", "hired", "shortlisted", "interviewScheduled"].includes(recommendation.status)) {
      return fail("A placement can only be recorded after selection or a confirmed hiring outcome.", 409);
    }
    const existing = await Placement.findOne({ recommendationId: recommendation._id });
    if (existing) return fail("A placement record already exists for this recommendation.", 409);

    const placement = await Placement.create({
      candidateId: recommendation.candidateId,
      jobId: recommendation.jobId || null,
      recommendationId: recommendation._id,
      companyId: recommendation.companyId,
      counselingTeamId: recommendation.counselingTeamId,
      counselorId: recommendation.counselorId,
      source: "counselingReferral",
      status: "recorded",
      notes: cleanString(body.note, 3000),
      recordedBy: toObjectId(auth.session.userId),
      history: [{ status: "recorded", note: "Placement recorded from recommendation", by: toObjectId(auth.session.userId), at: new Date() }],
    });
    await logActivity({
      session: auth.session,
      action: "placement.recorded",
      entity: "Placement",
      entityId: String(placement._id),
      description: "Recorded a placement from a counseling recommendation.",
    });
    return created({ placement });
  } catch (error) {
    return handleError(error);
  }
}

