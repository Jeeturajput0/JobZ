import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { resolveCompanyId, getCompanyJobFilter } from "@/lib/company";
import mongoose from "mongoose";
import Company from "@/models/Company";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Interview from "@/models/Interview";
import HiringRequest from "@/models/HiringRequest";
import Partnership from "@/models/Partnership";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Placement from "@/models/Placement";
import CounselingTeam from "@/models/CounselingTeam";
import ActivityLog from "@/models/ActivityLog";
import { APPLICATION_STATUSES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.dashboard.view", "company.analytics.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ stats: {}, recent: {}, pipeline: [], performance: [] });
    const cid = new mongoose.Types.ObjectId(companyId);

    const [company, jobs, applications, interviews, hiringRequests, partnerships, recommendations, placements] = await Promise.all([
      Company.findById(cid).lean(),
      Job.find(await getCompanyJobFilter(companyId)).lean(),
      Application.find({ companyId: cid })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "jobSeekerId", select: "fullName" }).lean(),
      Interview.find({ companyId: cid }).populate({ path: "jobId", select: "title" }).populate({ path: "candidateId", select: "fullName" }).sort({ scheduledAt: -1 }).lean(),
      HiringRequest.find({ companyId: cid }).sort({ createdAt: -1 }).lean(),
      Partnership.find({ companyId: cid }).populate({ path: "counselingTeamId", select: "name" }).sort({ createdAt: -1 }).lean(),
      CandidateRecommendation.find({ companyId: cid })
        .populate({ path: "candidateId", select: "fullName" })
        .populate({ path: "jobId", select: "title" }).sort({ createdAt: -1 }).lean(),
      Placement.find({ companyId: cid }).populate({ path: "candidateId", select: "fullName" }).sort({ createdAt: -1 }).lean(),
    ]);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const createdAtOf = (v: unknown) => (v as { createdAt?: Date } | null)?.createdAt;
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === "active" && j.approvalStatus === "approved").length,
      pendingApprovalJobs: jobs.filter((j) => j.approvalStatus === "pending").length,
      closedJobs: jobs.filter((j) => j.status === "closed").length,
      totalApplicants: applications.length,
      newApplicants: applications.filter((a) => +new Date(a.appliedAt) >= sevenDaysAgo).length,
      shortlistedCandidates: applications.filter((a) => ["shortlisted", "selected"].includes(a.status)).length,
      interviewsScheduled: interviews.filter((i) => i.status === "scheduled").length,
      candidatesSelected: applications.filter((a) => ["selected", "offerReceived"].includes(a.status)).length,
      confirmedHires: applications.filter((a) => a.status === "hired").length + placements.filter((p) => p.status === "confirmed").length,
      pendingHiringRequests: hiringRequests.filter((h) => ["submitted", "underReview"].includes(h.status)).length,
      activePartnerships: partnerships.filter((p) => p.status === "accepted").length,
    };

    const pipeline = APPLICATION_STATUSES.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    })).filter((item) => item.count > 0);

    const performance = jobs.slice(0, 10).map((job) => ({
      id: String(job._id),
      title: job.title,
      status: job.status,
      approvalStatus: job.approvalStatus,
      applications: applications.filter((a) => String(a.jobId?._id || a.jobId) === String(job._id)).length,
    })).sort((a, b) => b.applications - a.applications);

    const profileFields = [company?.name, company?.description, company?.industry, company?.logo, company?.website, company?.email, company?.phone, company?.headquarters, company?.city, company?.companySize];
    const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

    const missing = ["name", "description", "industry", "logo", "website", "email", "phone", "headquarters", "city", "companySize"]
      .filter((field) => !company || !(company as unknown as Record<string, unknown>)[field]);

    const [activity, teams] = await Promise.all([
      ActivityLog.find({ companyId: cid }).sort({ createdAt: -1 }).limit(10).lean(),
      CounselingTeam.find({ _id: { $in: partnerships.map((p) => p.counselingTeamId) } }).select("name").lean(),
    ]);
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));

    return ok({
      stats,
      profileCompletion,
      missingProfileFields: missing,
      recent: {
        jobs: jobs.slice().sort((a, b) => +new Date(createdAtOf(b) || 0) - +new Date(createdAtOf(a) || 0)).slice(0, 6).map((j) => ({
          id: String(j._id), title: j.title, status: j.status, approvalStatus: j.approvalStatus, createdAt: j.createdAt,
          applications: applications.filter((a) => String(a.jobId?._id || a.jobId) === String(j._id)).length,
        })),
        applications: applications.slice().sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt)).slice(0, 6).map((a) => ({
          id: String(a._id),
          candidate: (a.jobSeekerId as { fullName?: string })?.fullName || "Candidate",
          job: (a.jobId as { title?: string })?.title || "Job",
          status: a.status, appliedAt: a.appliedAt,
        })),
        interviews: interviews.filter((i) => i.status === "scheduled").slice(0, 5).map((i) => ({
          id: String(i._id),
          candidate: (i.candidateId as { fullName?: string })?.fullName || "Candidate",
          job: (i.jobId as { title?: string })?.title || "Job",
          scheduledAt: i.scheduledAt, mode: i.mode,
        })),
        recommendations: recommendations.slice(0, 5).map((r) => ({
          id: String(r._id),
          candidate: (r.candidateId as { fullName?: string })?.fullName || "Candidate",
          job: (r.jobId as { title?: string })?.title || "Job",
          status: r.status, createdAt: createdAtOf(r),
        })),
        activity,
      },
      pipeline,
      performance,
      partners: partnerships.map((p) => ({
        id: String(p._id),
        name: (teamMap.get(String(p.counselingTeamId)) as { name?: string } | undefined)?.name || "Organization",
        status: p.status,
        createdAt: createdAtOf(p),
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
