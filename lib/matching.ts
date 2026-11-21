import { MATCH_WEIGHTS_DEFAULT } from "@/lib/constants";
import type { CompletionResult } from "@/lib/profile-completion";
import type { IJobSeekerProfile } from "@/models/JobSeekerProfile";
import type { IJob } from "@/models/Job";

export interface MatchSkillScore {
  skill: string;
  score: number;
}

export interface JobMatchInput {
  profile: Partial<IJobSeekerProfile> | null;
  job: Partial<IJob>;
  skillScores?: MatchSkillScore[];
  completion?: CompletionResult;
  weights?: Record<string, number>;
}

export interface JobMatchResult {
  score: number;
  breakdown: Record<string, number>;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string[];
  recommendedActions: string[];
  weightsVersion: string;
}

function norm(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function parseYears(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i);
  if (match) return Number(match[1]);
  if (/fresher|entry|intern/i.test(text)) return 0;
  if (/senior|lead|manager/i.test(text)) return 5;
  if (/mid|intermediate/i.test(text)) return 3;
  return 0;
}

/**
 * Deterministic, explainable match score. Weights are supplied by the caller
 * (loaded from platform settings) so admins can reconfigure without code.
 */
export function computeJobMatch(input: JobMatchInput): JobMatchResult {
  const weights = { ...MATCH_WEIGHTS_DEFAULT, ...(input.weights || {}) };
  const profile = input.profile || {};
  const job = input.job || {};
  const candidateSkills = new Set((profile.skills || []).map(norm));
  const jobSkills = (job.skills || []).map(norm).filter(Boolean);

  const matched = jobSkills.filter((s) => candidateSkills.has(s));
  const missing = jobSkills.filter((s) => !candidateSkills.has(s));
  const skillScore = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 60;

  const candidateYears = (profile.experience || []).reduce((max, exp) => {
    return Math.max(max, parseYears(`${exp.duration || ""} ${exp.position || ""}`));
  }, 0);
  const requiredYears = parseYears(`${job.experienceLevel || ""} ${(job.requirements || []).join(" ")}`);
  let experienceScore = 70;
  if (requiredYears > 0) {
    experienceScore = candidateYears >= requiredYears ? 100 : Math.round((candidateYears / requiredYears) * 100);
  }

  const hasDegree = (profile.education || []).some((e) =>
    norm(`${e.degree || ""} ${e.fieldOfStudy || ""}`).length > 0,
  );
  const educationKeyword = (job.requirements || []).find((r) => /degree|bachelor|master|b\.tech|m\.tech|graduate/i.test(r));
  const educationScore = educationKeyword ? (hasDegree ? 100 : 40) : hasDegree ? 90 : 60;

  const preferredLocations = (profile.jobPreferences?.locations || []).map(norm);
  const jobLocation = norm(job.location || "");
  const remoteOk = job.workMode === "remote" || job.workMode === "hybrid";
  const locationScore = preferredLocations.includes(jobLocation)
    ? 100
    : remoteOk || profile.jobPreferences?.openToRelocation
      ? 80
      : preferredLocations.length
        ? 30
        : 60;

  const preferredRoles = (profile.jobPreferences?.roles || []).map(norm);
  const title = norm(job.title || "");
  const roleScore = preferredRoles.some((role) => title.includes(role) || role.includes(title))
    ? 100
    : preferredRoles.length
      ? 40
      : 60;
  const typeScore = (profile.jobPreferences?.jobTypes || []).includes(job.jobType || "") ? 100 : 70;
  const careerScore = Math.round(roleScore * 0.7 + typeScore * 0.3);

  const scores = input.skillScores || [];
  const assessmentScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + Math.max(0, Math.min(100, s.score)), 0) / scores.length)
    : 60; // 60 = neutral when no assessment data exists (not a fabricated result)

  const breakdown: Record<string, number> = {
    skills: skillScore,
    experience: experienceScore,
    education: educationScore,
    location: locationScore,
    careerPreference: careerScore,
    assessment: assessmentScore,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const score = Math.round(
    Object.entries(breakdown).reduce(
      (sum, [key, value]) => sum + value * ((weights as Record<string, number>)[key] || 0),
      0,
    ) / totalWeight,
  );

  const explanation: string[] = [];
  explanation.push(
    `You match ${matched.length} of ${jobSkills.length} skills required for this role.`,
  );
  if (experienceScore >= 90) explanation.push("Your experience level matches the requirement.");
  else explanation.push("Your experience level is below the preferred level — you can still apply.");
  if (locationScore >= 80) explanation.push("The location or work mode fits your preferences.");
  if (assessmentScore >= 70) explanation.push("Your assessment results support this role.");

  const recommendedActions: string[] = [];
  if (missing.length) recommendedActions.push(`Consider learning: ${missing.slice(0, 5).join(", ")}.`);
  if (skillScore < 60) recommendedActions.push("Strengthen your core skills for this role.");
  if (!profile.resumeUrl) recommendedActions.push("Upload a resume before applying.");

  return {
    score,
    breakdown,
    matchedSkills: matched,
    missingSkills: missing,
    explanation,
    recommendedActions,
    weightsVersion: "weights-v1",
  };
}
