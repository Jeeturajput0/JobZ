import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import CounselingMembership from "@/models/CounselingMembership";
import CounselingRecord from "@/models/CounselingRecord";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Interview from "@/models/Interview";
import Placement from "@/models/Placement";
import ActivityLog from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const teamId = auth.session.counselingTeamId;
    if (!teamId) return ok({ members: [], activity: [] });

    const [members, records, recommendations, placements, activity] = await Promise.all([
      CounselingMembership.find({ teamId }).populate({ path: "userId", select: "fullName email status" }).lean(),
      CounselingRecord.find({ teamId }).select("assignedTo").lean(),
      CandidateRecommendation.find({ counselingTeamId: teamId }).select("counselorId").lean(),
      Placement.find({ counselingTeamId: teamId }).select("counselorId").lean(),
      ActivityLog.find({ counselingTeamId: teamId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const recIds = await CandidateRecommendation.find({ counselingTeamId: teamId }).select("_id").lean();
    const interviews = await Interview.countDocuments({ recommendationId: { $in: recIds.map((r) => r._id) } });

    const workload = members.map((m) => {
      const uid = String((m.userId as { _id?: unknown })?._id || m.userId);
      return {
        userId: uid,
        name: (m.userId as { fullName?: string })?.fullName || "Member",
        email: (m.userId as { email?: string })?.email || "",
        status: m.status,
        title: m.title,
        assignedCandidates: records.filter((r) => String(r.assignedTo) === uid).length,
        recommendations: recommendations.filter((r) => String(r.counselorId) === uid).length,
        placements: placements.filter((p) => String(p.counselorId) === uid).length,
      };
    });

    return ok({ members: workload, interviews, activity });
  } catch (error) {
    return handleError(error);
  }
}
