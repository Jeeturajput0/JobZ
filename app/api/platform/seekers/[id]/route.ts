import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import Application from "@/models/Application";
import SavedJob from "@/models/SavedJob";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import VerificationRequest from "@/models/VerificationRequest";
import CounselingRecord from "@/models/CounselingRecord";
import CandidateRecommendation from "@/models/CandidateRecommendation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.users.view"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "candidate id");
    const user = await User.findOne({ _id: id, role: "jobSeeker" }).select("-password").lean();
    if (!user) return fail("Job seeker not found.", 404);

    const [profile, applications, saved, attempts, verifications, counseling, recommendations, weights] = await Promise.all([
      JobSeekerProfile.findOne({ userId: id }).lean(),
      Application.find({ jobSeekerId: id })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "companyId", select: "name" })
        .sort({ appliedAt: -1 }).limit(50).lean(),
      SavedJob.find({ jobSeekerId: id }).populate({ path: "jobId", select: "title" }).lean(),
      AssessmentAttempt.find({ candidateId: id, status: "completed" })
        .select("assessmentId percentage skillScores strengths improvements completedAt").sort({ completedAt: -1 }).lean(),
      VerificationRequest.find({ candidateId: id }).select("category status note submittedAt reviewedAt decisionNote").sort({ createdAt: -1 }).lean(),
      CounselingRecord.find({ candidateId: id })
        .populate({ path: "teamId", select: "name" })
        .populate({ path: "assignedTo", select: "fullName" }).lean(),
      CandidateRecommendation.find({ candidateId: id })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "jobId", select: "title" })
        .sort({ createdAt: -1 }).lean(),
      getCompletionWeights(),
    ]);

    const completion = calculateProfileCompletion(profile, user, weights);
    return ok({
      user,
      // Sensitive document contents are intentionally never returned here.
      profile,
      completion,
      applications,
      savedJobs: saved,
      assessments: attempts,
      verifications,
      counselingAssociations: counseling,
      recommendations,
    });
  } catch (error) {
    return handleError(error);
  }
}
