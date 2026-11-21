import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import CounselingRecord from "@/models/CounselingRecord";
import VerificationRequest from "@/models/VerificationRequest";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.analytics.view", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const teamId = auth.session.counselingTeamId;
    const teamFilter = teamId ? { teamId } : {};

    const [total, assigned, incomplete, underReview, jobReady, verificationPending, assessmentPending, hired, recommended] =
      await Promise.all([
        CounselingRecord.countDocuments(teamFilter),
        teamId ? CounselingRecord.countDocuments({ ...teamFilter, assignedTo: auth.session.userId }) : 0,
        CounselingRecord.countDocuments({ ...teamFilter, workflowStatus: "profileIncomplete" }),
        CounselingRecord.countDocuments({ ...teamFilter, workflowStatus: { $in: ["profileReview", "profileEnhancement"] } }),
        CounselingRecord.countDocuments({ ...teamFilter, workflowStatus: { $in: ["jobReady", "jobMatching"] } }),
        VerificationRequest.countDocuments({ status: { $in: ["pendingReview", "underReview"] } }),
        AssessmentAttempt.countDocuments({ status: "inProgress" }),
        CounselingRecord.countDocuments({ ...teamFilter, workflowStatus: "hired" }),
        CandidateRecommendation.countDocuments(teamId ? { counselingTeamId: teamId } : {}),
      ]);

    const hiringRequests = await HiringRequest.countDocuments({ status: { $nin: ["completed", "cancelled"] } });
    const workflowBreakdown = await CounselingRecord.aggregate([
      { $match: teamFilter },
      { $group: { _id: "$workflowStatus", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    return ok({
      analytics: {
        total, assigned, incomplete, underReview, jobReady, verificationPending,
        assessmentPending, hired, recommended, hiringRequests, workflowBreakdown,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
