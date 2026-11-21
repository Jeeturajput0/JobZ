import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import CounselingRecord from "@/models/CounselingRecord";
import CounselingMembership from "@/models/CounselingMembership";
import Partnership from "@/models/Partnership";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Application from "@/models/Application";
import Interview from "@/models/Interview";
import Placement from "@/models/Placement";
import ActivityLog from "@/models/ActivityLog";
import User from "@/models/User";
import Company from "@/models/Company";

const createdAtOf = (value: unknown): Date | undefined =>
  (value as { createdAt?: Date } | null)?.createdAt;

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.dashboard.view", "counseling.analytics.view"]);
    if (!auth.authorized) return auth.response;
    const teamId = auth.session.counselingTeamId;
    if (!teamId) return ok({ stats: {}, recent: {}, widgets: {} });
    await connectDB();
    const tid = new mongoose.Types.ObjectId(teamId);

    const [records, members, partnerships, allRequests, recommendations, placements] = await Promise.all([
      CounselingRecord.find({ teamId: tid }).lean(),
      CounselingMembership.find({ teamId: tid }).populate({ path: "userId", select: "status" }).lean(),
      Partnership.find({ counselingTeamId: tid }).lean(),
      HiringRequest.find({}).lean(),
      CandidateRecommendation.find({ counselingTeamId: tid }).lean(),
      Placement.find({ counselingTeamId: tid }).lean(),
    ]);

    const recIds = recommendations.map((r) => r._id);
    const candidateIds = records.map((r) => String(r.candidateId));

    const [counselingApps, interviews, activeUsers] = await Promise.all([
      Application.countDocuments({ source: "recommendation", recommendationId: { $in: recIds } }),
      Interview.countDocuments({ recommendationId: { $in: recIds } }),
      User.countDocuments({ _id: { $in: candidateIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: "active" }),
    ]);

    const underCounseling = ["profileReview", "profileEnhancement", "verificationPending", "assessmentPending", "assessmentCompleted"];
    const awaiting = ["profileIncomplete", "verificationPending", "assessmentPending"];
    const openRequests = allRequests.filter((r) => ["submitted", "underReview", "assigned", "sourcing", "candidatesRecommended", "interviewing"].includes(r.status));

    const stats = {
      totalCandidates: records.length,
      activeCandidates: activeUsers,
      candidatesUnderCounseling: records.filter((r) => underCounseling.includes(r.workflowStatus)).length,
      totalCounselors: members.length,
      activeTeamMembers: members.filter((m) => m.status === "active" && (m.userId as { status?: string })?.status === "active").length,
      totalPartneredCompanies: new Set(partnerships.filter((p) => p.status === "accepted").map((p) => String(p.companyId))).size,
      pendingPartnershipRequests: partnerships.filter((p) => p.status === "pending").length,
      activePartnerships: partnerships.filter((p) => p.status === "accepted").length,
      totalHiringRequests: allRequests.length,
      pendingHiringRequests: allRequests.filter((r) => ["submitted", "underReview"].includes(r.status)).length,
      candidatesRecommended: recommendations.length,
      totalApplicationsThroughCounseling: counselingApps,
      interviewsScheduled: interviews,
      candidatesSelected: recommendations.filter((r) => ["selected", "hired"].includes(r.status)).length,
      confirmedPlacements: placements.filter((p) => p.status === "confirmed").length,
    };

    const recentRecords = [...records].sort((a, b) => +new Date(createdAtOf(b) || 0) - +new Date(createdAtOf(a) || 0)).slice(0, 5);
    const recentPartnerships = [...partnerships].sort((a, b) => +new Date(createdAtOf(b) || 0) - +new Date(createdAtOf(a) || 0)).slice(0, 5);
    const recentRequests = [...allRequests].sort((a, b) => +new Date(createdAtOf(b) || 0) - +new Date(createdAtOf(a) || 0)).slice(0, 5);
    const recentRecommendations = [...recommendations].sort((a, b) => +new Date(createdAtOf(b) || 0) - +new Date(createdAtOf(a) || 0)).slice(0, 5);

    const [activity, candidateUsers, companies, interviewDocs] = await Promise.all([
      ActivityLog.find({ counselingTeamId: tid }).sort({ createdAt: -1 }).limit(10).lean(),
      User.find({ _id: { $in: recentRecords.map((r) => r.candidateId) } }).select("fullName email").lean(),
      Company.find({ _id: { $in: recentPartnerships.map((p) => p.companyId) } }).select("name").lean(),
      Interview.find({ recommendationId: { $in: recIds } }).sort({ scheduledAt: -1 }).limit(5)
        .populate({ path: "candidateId", select: "fullName" }).populate({ path: "jobId", select: "title" }).lean(),
    ]);
    const userMap = new Map(candidateUsers.map((u) => [String(u._id), u]));
    const companyMap = new Map(companies.map((c) => [String(c._id), c]));

    return ok({
      stats,
      widgets: {
        recentCandidates: recentRecords.map((r) => ({
          id: String(r._id),
          name: (userMap.get(String(r.candidateId)) as { fullName?: string })?.fullName || "Candidate",
          workflowStatus: r.workflowStatus,
          assignedTo: r.assignedTo ? String(r.assignedTo) : null,
          createdAt: createdAtOf(r),
        })),
        awaitingFollowUp: records.filter((r) => awaiting.includes(r.workflowStatus)).length,
        assignedToCounselors: records.filter((r) => Boolean(r.assignedTo)).length,
        recentPartnerships: recentPartnerships.map((p) => ({
          id: String(p._id),
          company: (companyMap.get(String(p.companyId)) as { name?: string })?.name || "Company",
          status: p.status,
          createdAt: createdAtOf(p),
        })),
        hiring: {
          open: openRequests.length,
          candidatesRequired: openRequests.reduce((sum, r) => sum + (r.numberOfOpenings || 0), 0),
          fulfilled: allRequests.filter((r) => r.status === "completed").length,
        },
        placement: {
          recommended: recommendations.length,
          interviewed: interviews,
          selected: stats.candidatesSelected,
          joined: stats.confirmedPlacements,
        },
        recentRequests: recentRequests.map((r) => ({ id: String(r._id), jobTitle: r.jobTitle, status: r.status, createdAt: createdAtOf(r) })),
        recentRecommendations: recentRecommendations.map((r) => ({ id: String(r._id), status: r.status, createdAt: createdAtOf(r) })),
        recentInterviews: interviewDocs.map((i) => ({
          id: String(i._id),
          candidate: (i.candidateId as { fullName?: string })?.fullName || "Candidate",
          job: (i.jobId as { title?: string })?.title || "Job",
          scheduledAt: i.scheduledAt,
          status: i.status,
        })),
      },
      recent: { activity },
    });
  } catch (error) {
    return handleError(error);
  }
}
