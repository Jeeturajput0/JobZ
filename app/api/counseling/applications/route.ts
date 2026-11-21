import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.applications.view", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    if (!auth.session.counselingTeamId) return ok({ applications: [], total: 0 });

    const recommendations = await CandidateRecommendation.find({ counselingTeamId: auth.session.counselingTeamId })
      .select("_id candidateId jobId companyId counselorId").lean();
    const recMap = new Map(recommendations.map((r) => [String(r._id), r]));
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {
      $or: [
        { recommendationId: { $in: recommendations.map((r) => r._id) } },
        { source: "recommendation", jobSeekerId: { $in: recommendations.map((r) => r.candidateId) } },
      ],
    };
    if (sp.get("status")) query.status = sp.get("status");
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "jobSeekerId", select: "fullName email" })
        .populate({ path: "companyId", select: "name" })
        .sort({ appliedAt: -1 }).skip(skip).limit(limit).lean(),
      Application.countDocuments(query),
    ]);
    return ok({
      applications: applications.map((a) => ({
        ...a,
        counselorId: recMap.get(String(a.recommendationId))?.counselorId || null,
        recommendationId: a.recommendationId ? String(a.recommendationId) : null,
      })),
      total, page, limit,
    });
  } catch (error) {
    return handleError(error);
  }
}
