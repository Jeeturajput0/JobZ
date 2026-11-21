import type { IJobSeekerProfile } from "@/models/JobSeekerProfile";
import type { IUser } from "@/models/User";

export interface CompletionCategory {
  key: string;
  label: string;
  weight: number;
  percentage: number;
  complete: boolean;
}

export interface CompletionResult {
  percentage: number;
  status: "incomplete" | "inProgress" | "complete";
  jobReadiness: "notReady" | "developing" | "ready";
  verificationStatus: string;
  categories: CompletionCategory[];
  missingSections: string[];
  suggestions: string[];
  recommendedActions: string[];
}

export const DEFAULT_COMPLETION_WEIGHTS: Record<string, number> = {
  basic: 15,
  education: 15,
  skills: 15,
  resume: 15,
  projects: 10,
  achievements: 5,
  careerGoals: 10,
  jobPreferences: 10,
  experience: 5,
};

function pct(value: boolean | number): number {
  if (typeof value === "number") return Math.min(100, Math.max(0, Math.round(value)));
  return value ? 100 : 0;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Calculates completion from real database fields — never from a stored
 * hard-coded percentage. Weights can be overridden from platform settings.
 */
export function calculateProfileCompletion(
  profile: Partial<IJobSeekerProfile> | null,
  user: Partial<IUser> | null,
  weights: Record<string, number> = DEFAULT_COMPLETION_WEIGHTS,
): CompletionResult {
  const p = profile || {};
  const u = user || {};
  const isFresher =
    String(p.careerLevel || "").toLowerCase().includes("fresher") ||
    (!p.experience?.length && (p.projects?.length || 0) > 0);

  const scores: Record<string, number> = {
    basic:
      (pct(hasText(u.fullName)) +
        pct(hasText(u.phone || p.phone)) +
        pct(hasText(p.city || p.location)) +
        pct(hasText(p.summary)) +
        pct(hasText(p.profileImage))) /
      5,
    education: pct((p.education?.length || 0) > 0),
    skills: pct((p.skills?.length || 0) >= 3),
    resume: pct(hasText(p.resumeUrl)),
    projects: pct((p.projects?.length || 0) > 0),
    achievements: pct((p.achievements?.length || 0) > 0),
    careerGoals: pct(hasText(p.careerGoals)),
    jobPreferences: pct(
      ((p.jobPreferences?.roles?.length || 0) > 0 ? 50 : 0) +
        ((p.jobPreferences?.locations?.length || 0) > 0 ? 50 : 0),
    ),
    experience: isFresher
      ? pct((p.projects?.length || 0) > 0)
      : pct((p.experience?.length || 0) > 0),
  };

  const categories: CompletionCategory[] = Object.entries(weights).map(
    ([key, weight]) => ({
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      weight,
      percentage: scores[key] ?? 0,
      complete: (scores[key] ?? 0) >= 100,
    }),
  );

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0) || 1;
  const percentage = Math.round(
    categories.reduce((sum, c) => sum + (c.percentage * c.weight) / totalWeight, 0),
  );

  const missingSections = categories
    .filter((c) => !c.complete)
    .map((c) => c.label);

  const suggestions = categories
    .filter((c) => !c.complete)
    .map((c) => `Improve your ${c.label.toLowerCase()} section.`);

  const verified = p.verificationStatus === "verified";
  const jobReadiness =
    percentage >= 80 && verified
      ? "ready"
      : percentage >= 60
        ? "developing"
        : "notReady";

  const recommendedActions: string[] = [];
  if (!hasText(p.resumeUrl)) recommendedActions.push("Upload an up-to-date resume.");
  if ((p.skills?.length || 0) < 3) recommendedActions.push("Add at least three relevant skills.");
  if (!hasText(p.careerGoals)) recommendedActions.push("Describe your career goals.");
  if (!verified) recommendedActions.push("Submit documents for verification.");

  return {
    percentage,
    status: percentage >= 100 ? "complete" : percentage >= 40 ? "inProgress" : "incomplete",
    jobReadiness,
    verificationStatus: p.verificationStatus || "notSubmitted",
    categories,
    missingSections,
    suggestions,
    recommendedActions,
  };
}
