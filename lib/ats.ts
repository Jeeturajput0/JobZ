import type { IJobSeekerProfile } from "@/models/JobSeekerProfile";
import type { IJob } from "@/models/Job";
import type { MatchSkillScore } from "@/lib/matching";

export interface AtsInput {
  job: Partial<IJob>;
  profile: Partial<IJobSeekerProfile> | null;
  skillScores?: MatchSkillScore[];
  resumeDataUrl?: string;
  version?: string;
}

export interface AtsResult {
  overallScore: number;
  breakdown: {
    requiredSkills: number;
    preferredSkills: number;
    experience: number;
    education: number;
    projects: number;
    resumeQuality: number;
    assessments: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  profileSuggestions: string[];
  resumeSuggestions: string[];
  version: string;
  aiAssisted: false;
}

function norm(v: string): string {
  return v.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Rule-based, explainable ATS scoring built only from real job/candidate data.
 * `aiAssisted` is explicitly false — there is no external AI service here.
 * The score is advisory and must never be used for automatic rejection.
 */
export function evaluateAts(input: AtsInput): AtsResult {
  const profile = input.profile || {};
  const job = input.job || {};
  const skills = (job.skills || []).map(norm).filter(Boolean);
  const split = Math.ceil(skills.length * 0.7);
  const required = skills.slice(0, split);
  const preferred = skills.slice(split);
  const candidateSkills = new Set((profile.skills || []).map(norm));

  const scoreSkills = (list: string[]) =>
    list.length ? Math.round((list.filter((s) => candidateSkills.has(s)).length / list.length) * 100) : 70;

  const requiredSkills = scoreSkills(required);
  const preferredSkills = scoreSkills(preferred);

  const expText = `${(profile.experience || []).map((e) => `${e.position} ${e.description || ""}`).join(" ")}`.toLowerCase();
  const jobText = `${job.title || ""} ${(job.description || "").slice(0, 1200)} ${(job.requirements || []).join(" ")}`.toLowerCase();
  const jobKeywords = Array.from(new Set(jobText.split(/[^a-z0-9+#.]+/).filter((w) => w.length > 3))).slice(0, 25);
  const matchedKeywords = jobKeywords.filter((k) => expText.includes(k));
  const experience = jobKeywords.length
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 60;

  const hasDegree = (profile.education || []).some((e) => norm(e.degree || "").length > 0);
  const requiresDegree = /(degree|bachelor|master|graduate)/i.test(jobText);
  const education = requiresDegree ? (hasDegree ? 100 : 45) : hasDegree ? 90 : 70;

  const projectText = (profile.projects || [])
    .map((p) => `${p.title} ${p.description} ${(p.technologies || []).join(" ")}`)
    .join(" ")
    .toLowerCase();
  const relevantProjects = jobKeywords.filter((k) => projectText.includes(k));
  const projects = jobKeywords.length
    ? Math.round((relevantProjects.length / jobKeywords.length) * 100)
    : (profile.projects?.length || 0) > 0
      ? 80
      : 50;

  let resumeQuality = 40;
  if (input.resumeDataUrl || profile.resumeUrl) resumeQuality += 25;
  if ((profile.summary || "").length >= 80) resumeQuality += 15;
  if ((profile.projects?.length || 0) > 0) resumeQuality += 10;
  if ((profile.achievements?.length || 0) > 0) resumeQuality += 10;
  resumeQuality = Math.min(100, resumeQuality);

  const scores = input.skillScores || [];
  const assessments = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 50; // neutral when no assessment evidence exists

  const breakdown: AtsResult["breakdown"] = {
    requiredSkills,
    preferredSkills,
    experience,
    education,
    projects,
    resumeQuality,
    assessments,
  };
  const weights: Record<keyof AtsResult["breakdown"], number> = {
    requiredSkills: 0.3,
    preferredSkills: 0.1,
    experience: 0.2,
    education: 0.1,
    projects: 0.1,
    resumeQuality: 0.1,
    assessments: 0.1,
  };
  const overallScore = Math.round(
    (Object.keys(breakdown) as (keyof typeof breakdown)[]).reduce(
      (sum, key) => sum + breakdown[key] * weights[key],
      0,
    ),
  );

  const matchedSkills = skills.filter((s) => candidateSkills.has(s));
  const missingSkills = required.filter((s) => !candidateSkills.has(s));

  const profileSuggestions: string[] = [];
  if (missingSkills.length) profileSuggestions.push(`Add these skills to your profile: ${missingSkills.join(", ")}.`);
  if (!hasDegree && requiresDegree) profileSuggestions.push("Add your education details.");
  if (!(profile.experience?.length)) profileSuggestions.push("Add relevant experience or projects.");

  const resumeSuggestions: string[] = [];
  if (!input.resumeDataUrl && !profile.resumeUrl) resumeSuggestions.push("Attach a resume to this application.");
  if ((profile.summary || "").length < 80) resumeSuggestions.push("Write a stronger professional summary.");
  if (!(profile.achievements?.length)) resumeSuggestions.push("Include measurable achievements.");

  return {
    overallScore,
    breakdown,
    matchedSkills,
    missingSkills,
    profileSuggestions,
    resumeSuggestions,
    version: input.version || "ats-v1",
    aiAssisted: false,
  };
}
