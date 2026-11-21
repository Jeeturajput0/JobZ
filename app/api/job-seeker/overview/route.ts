import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import Job from "@/models/Job";
import EmployerProfile from "@/models/EmployerProfile";
import Interview from "@/models/Interview";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import CounselingRecord from "@/models/CounselingRecord";
import CounselingTeam from "@/models/CounselingTeam";
import Notification from "@/models/Notification";
import { publicJobFilter } from "@/lib/public-jobs";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";
import { computeJobMatch } from "@/lib/matching";
import { getMatchWeights } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;
    await connectDB();
    const uid = new mongoose.Types.ObjectId(userId);

    const [profile, user, weights, matchWeights, applications, saved, recentJobs, interviews, recommendations, counseling, unread] = await Promise.all([
      JobSeekerProfile.findOne({ userId: uid }).lean(),
      User.findById(uid).select("fullName email").lean(),
      getCompletionWeights(),
      getMatchWeights(),
      Application.find({ jobSeekerId: uid })
        .populate({ path: "jobId", select: "title location jobType" })
        .populate({ path: "companyId", select: "name" })
        .sort({ appliedAt: -1 }).lean(),
      SavedJob.find({ jobSeekerId: uid }).populate({ path: "jobId", model: Job, match: publicJobFilter(), populate: { path: "companyId", model: EmployerProfile, select: "companyName companyLogo" } }).lean(),
      Job.find(publicJobFilter()).populate({ path: "companyId", model: EmployerProfile, select: "companyName companyLogo" }).sort({ createdAt: -1 }).limit(12).lean(),
      Interview.find({ candidateId: uid })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "companyId", select: "name" })
        .sort({ scheduledAt: 1 }).lean(),
      CandidateRecommendation.find({ candidateId: uid })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "jobId", select: "title" })
        .sort({ createdAt: -1 }).lean(),
      CounselingRecord.find({ candidateId: uid })
        .populate({ path: "teamId", select: "name" })
        .populate({ path: "assignedTo", select: "fullName email" }).lean(),
      Notification.countDocuments({ userId: uid, read: false }),
    ]);

    const completion = calculateProfileCompletion(profile, user, weights);
    const stats = {
      profileCompletion: completion.percentage,
      totalApplications: applications.length,
      underReview: applications.filter((a) => ["underReview", "atsEvaluation", "pending", "reviewed"].includes(a.status)).length,
      shortlisted: applications.filter((a) => ["shortlisted", "selected"].includes(a.status)).length,
      interviewsScheduled: interviews.filter((i) => i.status === "scheduled").length,
      offersReceived: applications.filter((a) => ["offerReceived", "selected"].includes(a.status)).length,
      savedJobs: saved.filter((s) => s.jobId).length,
      unreadNotifications: unread,
    };

    const eligibleJobs = recentJobs.filter((j) => j && j._id);
    const recommended = eligibleJobs
      .map((job) => ({ job, match: computeJobMatch({ profile, job, weights: matchWeights }) }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 5)
      .map((m) => ({
        id: String(m.job._id),
        title: m.job.title,
        company: (m.job.companyId as { companyName?: string } | null)?.companyName || "",
        location: m.job.location,
        score: m.match.score,
        matchedSkills: m.match.matchedSkills,
        missingSkills: m.match.missingSkills,
      }));

    const now = Date.now();
    const upcomingInterviews = interviews
      .filter((i) => i.status === "scheduled" && +new Date(i.scheduledAt) >= now)
      .slice(0, 5)
      .map((i) => ({
        id: String(i._id),
        job: (i.jobId as { title?: string })?.title || "Job",
        company: (i.companyId as { name?: string })?.name || "",
        scheduledAt: i.scheduledAt,
        mode: i.mode,
        status: i.status,
      }));

    const recentApplications = applications.slice(0, 6).map((a) => ({
      id: String(a._id),
      job: (a.jobId as { title?: string })?.title || "Job",
      company: (a.companyId as { name?: string })?.name || "",
      status: a.status,
      appliedAt: a.appliedAt,
      source: a.source,
    }));

    const savedPreview = saved.filter((s) => s.jobId).slice(0, 5).map((s) => {
      const job = s.jobId as unknown as Record<string, unknown>;
      return {
        savedId: String(s._id),
        id: String(job._id),
        title: String(job.title || ""),
        company: String((job.companyId as Record<string, unknown> | null)?.companyName || ""),
        location: String(job.location || ""),
      };
    });

    const counselingTeams = await CounselingTeam.find({ _id: { $in: counseling.map((c) => c.teamId) } }).select("name").lean();
    const teamMap = new Map(counselingTeams.map((t) => [String(t._id), t]));
    const counselingSummary = counseling.map((c) => ({
      id: String(c._id),
      organization: (teamMap.get(String(c.teamId)) as { name?: string } | undefined)?.name || "",
      counselor: (c.assignedTo as { fullName?: string } | null)?.fullName || "",
      status: c.workflowStatus,
    }));

    return ok({
      stats,
      completion: {
        percentage: completion.percentage,
        status: completion.status,
        jobReadiness: completion.jobReadiness,
        verificationStatus: completion.verificationStatus,
        missingSections: completion.missingSections,
        suggestedActions: completion.recommendedActions,
        categories: completion.categories,
      },
      recommendedJobs: recommended,
      recentJobs: eligibleJobs.slice(0, 6).map((j) => ({
        id: String(j._id),
        title: j.title,
        company: (j.companyId as { companyName?: string } | null)?.companyName || "",
        location: j.location,
        createdAt: j.createdAt,
      })),
      recentApplications,
      upcomingInterviews,
      savedJobs: savedPreview,
      counseling: counselingSummary,
      applicationsByStatus: applications.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (error) {
    return handleError(error);
  }
}
