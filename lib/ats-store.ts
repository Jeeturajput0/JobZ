import { toObjectId } from "@/lib/api";
import { evaluateAts } from "@/lib/ats";
import { getAtsVersion } from "@/lib/settings";
import Job from "@/models/Job";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import AtsEvaluation from "@/models/AtsEvaluation";

/** Runs the explainable ATS engine against real job + candidate data. */
export async function evaluateAndStoreAts(input: {
  applicationId?: string | null;
  jobId: string;
  candidateId: string;
  companyId?: string | null;
  evaluatedBy?: string | null;
}) {
  const [job, profile, attempts, version] = await Promise.all([
    Job.findById(input.jobId).lean(),
    JobSeekerProfile.findOne({ userId: input.candidateId }).lean(),
    AssessmentAttempt.find({ candidateId: input.candidateId, status: "completed" })
      .select("skillScores")
      .sort({ completedAt: -1 })
      .limit(5)
      .lean(),
    getAtsVersion(),
  ]);
  if (!job) return null;

  const result = evaluateAts({
    job,
    profile,
    skillScores: attempts.flatMap((a) => a.skillScores || []),
    resumeDataUrl: profile?.resumeUrl,
    version,
  });

  return AtsEvaluation.create({
    applicationId: input.applicationId ? toObjectId(input.applicationId) : null,
    jobId: toObjectId(input.jobId)!,
    candidateId: toObjectId(input.candidateId)!,
    companyId: input.companyId ? toObjectId(input.companyId) : null,
    overallScore: result.overallScore,
    breakdown: result.breakdown,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    profileSuggestions: result.profileSuggestions,
    resumeSuggestions: result.resumeSuggestions,
    version: result.version,
    aiAssisted: result.aiAssisted,
    evaluatedBy: input.evaluatedBy ? toObjectId(input.evaluatedBy) : null,
  });
}
