import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import Partnership from "@/models/Partnership";
import Company from "@/models/Company";
import Job from "@/models/Job";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Interview from "@/models/Interview";
import Placement from "@/models/Placement";
import ActivityLog from "@/models/ActivityLog";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.hiringRequests.view", "counseling.contact.companies", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "partnership id");
    const partnership = await Partnership.findOne({ _id: id, counselingTeamId: auth.session.counselingTeamId })
      .populate({ path: "companyId", select: "name industry website logo" })
      .populate({ path: "requestedBy", select: "fullName" })
      .populate({ path: "reviewedBy", select: "fullName" }).lean();
    if (!partnership) return fail("Partnership not found.", 404);

    const companyId = partnership.companyId;
    const [company, jobs, hiringRequests, recommendations, interviews, placements, activity] = await Promise.all([
      Company.findById(companyId).select("name industry description website").lean(),
      Job.find({ companyId, status: "active", approvalStatus: "approved" }).select("title location jobType skills").sort({ createdAt: -1 }).lean(),
      HiringRequest.find({ companyId }).sort({ createdAt: -1 }).limit(30).lean(),
      CandidateRecommendation.find({ companyId, counselingTeamId: auth.session.counselingTeamId })
        .populate({ path: "candidateId", select: "fullName" }).populate({ path: "jobId", select: "title" }).sort({ createdAt: -1 }).lean(),
      Interview.find({ companyId }).populate({ path: "candidateId", select: "fullName" }).sort({ scheduledAt: -1 }).lean(),
      Placement.find({ companyId, counselingTeamId: auth.session.counselingTeamId })
        .populate({ path: "candidateId", select: "fullName" }).populate({ path: "jobId", select: "title" }).sort({ createdAt: -1 }).lean(),
      ActivityLog.find({ entity: "Partnership", entityId: id }).sort({ createdAt: -1 }).lean(),
    ]);
    const recIds = recommendations.map((r) => String(r._id));
    const scopedInterviews = interviews.filter((i) => !i.recommendationId || recIds.includes(String(i.recommendationId)));
    return ok({
      partnership,
      company,
      jobs,
      hiringRequests,
      recommendations,
      interviews: scopedInterviews,
      placements,
      activity,
    });
  } catch (error) {
    return handleError(error);
  }
}
