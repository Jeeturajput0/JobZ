import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import mongoose from "mongoose";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import Application from "@/models/Application";
import Interview from "@/models/Interview";
import SavedJob from "@/models/SavedJob";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Placement from "@/models/Placement";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";

const createdAtOf = (value: unknown): Date | undefined =>
  (value as { createdAt?: Date } | null)?.createdAt;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const uid = new mongoose.Types.ObjectId(auth.session.userId);
    const [profile, user, applications, interviews, savedCount, attempts, recommendations, placements, weights] = await Promise.all([
      JobSeekerProfile.findOne({ userId: uid }).lean(),
      User.findById(uid).select("fullName createdAt").lean(),
      Application.find({ jobSeekerId: uid }).populate({ path: "jobId", select: "title" }).populate({ path: "companyId", select: "name" }).sort({ appliedAt: -1 }).lean(),
      Interview.find({ candidateId: uid }).populate({ path: "jobId", select: "title" }).sort({ scheduledAt: -1 }).lean(),
      SavedJob.countDocuments({ jobSeekerId: uid }),
      AssessmentAttempt.countDocuments({ candidateId: uid, status: "completed" }),
      CandidateRecommendation.find({ candidateId: uid }).populate({ path: "companyId", select: "name" }).lean(),
      Placement.find({ candidateId: uid }).populate({ path: "companyId", select: "name" }).lean(),
      getCompletionWeights(),
    ]);

    const completion = calculateProfileCompletion(profile, user, weights);
    type Event = { date: Date; type: string; title: string; detail: string };
    const events: Event[] = [];
    events.push({ date: createdAtOf(user) || new Date(0), type: "profile", title: "Joined JobZ", detail: "Account created" });
    applications.forEach((a) => events.push({
      date: a.appliedAt,
      type: "application",
      title: `Applied to ${(a.jobId as { title?: string })?.title || "a job"}`,
      detail: `Status: ${a.status}`,
    }));
    interviews.forEach((i) => events.push({
      date: i.scheduledAt,
      type: "interview",
      title: `Interview for ${(i.jobId as { title?: string })?.title || "a job"}`,
      detail: `Status: ${i.status}`,
    }));
    recommendations.forEach((r) => events.push({
      date: createdAtOf(r) || new Date(0),
      type: "recommendation",
      title: `Recommended to ${(r.companyId as { name?: string })?.name || "a company"}`,
      detail: `Status: ${r.status}`,
    }));
    placements.forEach((p) => events.push({
      date: p.joiningDate || createdAtOf(p) || new Date(0),
      type: "placement",
      title: `Joining confirmed at ${(p.companyId as { name?: string })?.name || "a company"}`,
      detail: `Status: ${p.status}`,
    }));
    events.sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const suggestions: string[] = [];
    if (completion.percentage < 100) suggestions.push(...completion.recommendedActions);
    if (!applications.length) suggestions.push("Apply to jobs that match your skills to start your journey.");
    if (!attempts) suggestions.push("Take a skill assessment to understand your strengths.");

    return ok({
      completion,
      counts: {
        applications: applications.length,
        interviews: interviews.length,
        savedJobs: savedCount,
        assessments: attempts,
        recommendations: recommendations.length,
        placements: placements.length,
        shortlisted: applications.filter((a) => ["shortlisted", "selected"].includes(a.status)).length,
        selected: applications.filter((a) => ["selected", "offerReceived", "hired"].includes(a.status)).length,
      },
      timeline: events.slice(0, 40),
      suggestions,
    });
  } catch (error) {
    return handleError(error);
  }
}
