import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, parsePagination } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Interview from "@/models/Interview";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.applications.view", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    if (!auth.session.counselingTeamId) return ok({ interviews: [], total: 0 });

    const recs = await CandidateRecommendation.find({ counselingTeamId: auth.session.counselingTeamId })
      .select("_id counselorId").lean();
    const recMap = new Map(recs.map((r) => [String(r._id), r]));
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { recommendationId: { $in: recs.map((r) => r._id) } };
    if (sp.get("status")) query.status = sp.get("status");
    const [interviews, total] = await Promise.all([
      Interview.find(query)
        .populate({ path: "candidateId", select: "fullName email" })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "companyId", select: "name" })
        .sort({ scheduledAt: -1 }).skip(skip).limit(limit).lean(),
      Interview.countDocuments(query),
    ]);
    return ok({
      interviews: interviews.map((i) => ({
        ...i,
        counselorId: recMap.get(String(i.recommendationId))?.counselorId || null,
      })),
      total, page, limit,
    });
  } catch (error) {
    return handleError(error);
  }
}

/** Adds a counseling follow-up note to an authorized interview record. */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.notes.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const body = await readJson(request);
    if (!body.id || typeof body.id !== "string") return fail("A valid interview id is required.", 400);
    const id = requireObjectId(body.id, "interview id");
    const recs = await CandidateRecommendation.find({ counselingTeamId: auth.session.counselingTeamId }).select("_id").lean();
    const interview = await Interview.findOne({ _id: id, recommendationId: { $in: recs.map((r) => r._id) } });
    if (!interview) return fail("Interview not found for your organization.", 404);
    const note = cleanString(body.followUpNote, 2000);
    if (!note) return fail("Follow-up note is required.", 400);
    interview.notes = `${interview.notes || ""}\nCounseling follow-up (${auth.session.fullName}): ${note}`.trim();
    await interview.save();
    await logActivity({ session: auth.session, action: "interview.counseling.followup", entity: "Interview", entityId: id, description: "Added a counseling follow-up note to an interview." });
    return ok({ interview });
  } catch (error) {
    return handleError(error);
  }
}
