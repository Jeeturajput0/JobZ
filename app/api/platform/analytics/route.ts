import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import CounselingTeam from "@/models/CounselingTeam";
import VerificationRequest from "@/models/VerificationRequest";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import AssessmentAttempt from "@/models/AssessmentAttempt";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.analytics.view"]);
    if (!auth.authorized) return auth.response;
    await connectDB();

    const [
      totalUsers, candidates, companies, companyMembers, counselingAdmins, counselingMembers,
      totalJobs, activeJobs, pendingJobs, totalApplications, pendingVerification,
      counselingTeams, hiringRequests, recommendations, assessmentsCompleted,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "jobSeeker" }),
      User.countDocuments({ role: "employer" }),
      User.countDocuments({ role: "companyMember" }),
      User.countDocuments({ role: "counselingAdmin" }),
      User.countDocuments({ role: "counselingMember" }),
      Job.countDocuments({}),
      Job.countDocuments({ status: "active", approvalStatus: "approved" }),
      Job.countDocuments({ approvalStatus: "pending" }),
      Application.countDocuments({}),
      VerificationRequest.countDocuments({ status: { $in: ["pendingReview", "underReview"] } }),
      CounselingTeam.countDocuments({}),
      HiringRequest.countDocuments({ status: { $nin: ["completed", "cancelled"] } }),
      CandidateRecommendation.countDocuments({ status: { $nin: ["rejected", "hired"] } }),
      AssessmentAttempt.countDocuments({ status: "completed" }),
    ]);

    const applicationsByStatus = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    return ok({
      analytics: {
        totalUsers, candidates, companies, companyMembers, counselingAdmins, counselingMembers,
        totalJobs, activeJobs, pendingJobs, totalApplications, pendingVerification,
        counselingTeams, hiringRequests, recommendations, assessmentsCompleted,
        applicationsByStatus,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
