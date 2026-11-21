import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Company from "@/models/Company";
import CounselingTeam from "@/models/CounselingTeam";
import Partnership from "@/models/Partnership";
import Placement from "@/models/Placement";
import ActivityLog from "@/models/ActivityLog";
import EmployerProfile from "@/models/EmployerProfile";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.analytics.view"]);
    if (!auth.authorized) return auth.response;
    await connectDB();

    const [
      totalCompanies, verifiedCompanies, pendingCompanyVerification, rejectedCompanies,
      totalCounselingOrgs, activeCounselingOrgs, totalJobSeekers, totalJobs,
      activeJobs, pendingJobs, totalApplications, totalPartnerships,
      activePartnerships, totalPlacements,
    ] = await Promise.all([
      Company.countDocuments({}),
      Company.countDocuments({ verificationStatus: "verified" }),
      Company.countDocuments({ verificationStatus: "pending" }),
      Company.countDocuments({ verificationStatus: "rejected" }),
      CounselingTeam.countDocuments({}),
      CounselingTeam.countDocuments({ status: "active" }),
      User.countDocuments({ role: "jobSeeker" }),
      Job.countDocuments({}),
      Job.countDocuments({ status: "active", approvalStatus: "approved" }),
      Job.countDocuments({ approvalStatus: "pending" }),
      Application.countDocuments({}),
      Partnership.countDocuments({}),
      Partnership.countDocuments({ status: "accepted" }),
      Placement.countDocuments({}),
    ]);

    const [
      recentCompanies, recentSeekers, recentJobs, pendingVerifications,
      pendingApprovals, recentApplications, recentPartnerships, recentActivity,
    ] = await Promise.all([
      Company.find({}).sort({ createdAt: -1 }).limit(6)
        .populate({ path: "ownerId", select: "fullName email" }).lean(),
      User.find({ role: "jobSeeker" }).sort({ createdAt: -1 }).limit(6).select("fullName email createdAt").lean(),
      Job.find({}).sort({ createdAt: -1 }).limit(6)
        .populate({ path: "employerId", select: "fullName" })
        .populate({ path: "companyId", model: EmployerProfile, select: "companyName" }).lean(),
      Company.find({ verificationStatus: "pending" }).sort({ createdAt: -1 }).limit(6)
        .populate({ path: "ownerId", select: "fullName email" }).lean(),
      Job.find({ approvalStatus: "pending" }).sort({ createdAt: -1 }).limit(6)
        .populate({ path: "companyId", model: EmployerProfile, select: "companyName" }).lean(),
      Application.find({}).sort({ appliedAt: -1 }).limit(6)
        .populate({ path: "jobSeekerId", select: "fullName" })
        .populate({ path: "jobId", select: "title" }).lean(),
      Partnership.find({}).sort({ createdAt: -1 }).limit(6)
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "counselingTeamId", select: "name" }).lean(),
      ActivityLog.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    return ok({
      stats: {
        totalCompanies, verifiedCompanies, pendingCompanyVerification, rejectedCompanies,
        totalCounselingOrgs, activeCounselingOrgs, totalJobSeekers, totalJobs,
        activeJobs, pendingJobs, totalApplications, totalPartnerships,
        activePartnerships, totalPlacements,
      },
      recent: {
        companies: recentCompanies,
        seekers: recentSeekers,
        jobs: recentJobs,
        pendingVerifications: pendingVerifications,
        pendingApprovals: pendingApprovals,
        applications: recentApplications,
        partnerships: recentPartnerships,
        activity: recentActivity,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
