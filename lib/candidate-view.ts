import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import AtsEvaluation from "@/models/AtsEvaluation";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import type { Session } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export type CandidateViewRole = "company" | "counseling";

/**
 * Builds a permission-filtered candidate view. Sensitive fields are only
 * included when the caller holds the matching permission AND a legitimate
 * relationship exists (checked by the caller before invoking this helper).
 */
export async function buildCandidateView(
  candidateId: string,
  session: Session,
  role: CandidateViewRole,
): Promise<Record<string, unknown> | null> {
  const user = await User.findById(candidateId).select("-password").lean();
  if (!user || user.role !== "jobSeeker") return null;
  const profile = await JobSeekerProfile.findOne({ userId: candidateId }).lean();

  const view: Record<string, unknown> = {
    id: String(user._id),
    fullName: user.fullName,
    username: user.username,
    headline: profile?.headline || "",
    summary: profile?.summary || "",
    location: profile?.location || "",
    city: profile?.city || "",
    state: profile?.state || "",
    country: profile?.country || "",
    skills: profile?.skills || [],
    skillLevels: profile?.skillLevels || {},
    projects: profile?.projects || [],
    achievements: profile?.achievements || [],
    certifications: profile?.certifications || [],
    careerGoals: profile?.careerGoals || "",
    portfolioUrl: profile?.portfolioUrl || "",
    verificationStatus: profile?.verificationStatus || "notSubmitted",
    profileCompletion: 0,
  };

  const p = session.permissions;
  if (role === "company") {
    // The candidate controls sharing. An explicit opt-out always wins, and a
    // non-empty sharedFields list limits exactly which fields may be shared.
    const consentAllowed = profile?.consentShareWithCompanies !== false;
    const shared = (profile?.sharedFields as string[] | undefined) || [];
    const mayShare = (field: string) =>
      consentAllowed && (shared.length === 0 || shared.includes(field));

    if (hasPermission(p, "company.candidates.contact") && mayShare("contact")) {
      view.email = user.email;
      view.phone = user.phone || profile?.phone || "";
    }
    if (hasPermission(p, "company.candidates.education.view") && mayShare("education")) view.education = profile?.education || [];
    if (hasPermission(p, "company.candidates.experience.view") && mayShare("experience")) view.experience = profile?.experience || [];
    if (hasPermission(p, "company.candidates.skills.view") && mayShare("skills")) view.skills = profile?.skills || [];
    if (hasPermission(p, "company.candidates.resume.view") && mayShare("resumeUrl")) view.resumeUrl = profile?.resumeUrl || "";
    if (hasPermission(p, "company.candidates.assessments.view") && mayShare("assessments")) {
      view.assessments = await AssessmentAttempt.find({ candidateId, status: "completed" })
        .select("assessmentId percentage skillScores strengths improvements completedAt")
        .sort({ completedAt: -1 })
        .limit(20)
        .lean();
    }
    if (hasPermission(p, "company.ats.view") && mayShare("ats")) {
      view.atsEvaluations = await AtsEvaluation.find({ candidateId })
        .select("jobId overallScore breakdown matchedSkills missingSkills version createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }
  } else {
    // Counseling team is already restricted to assigned candidates by the
    // caller. Notes are delivered by a dedicated, separately-gated endpoint.
    view.email = user.email;
    view.phone = user.phone || profile?.phone || "";
    view.education = profile?.education || [];
    view.experience = profile?.experience || [];
    view.resumeUrl = profile?.resumeUrl || "";
    view.jobPreferences = profile?.jobPreferences || {};
    view.consentShareWithCompanies = profile?.consentShareWithCompanies || false;
    view.assessments = await AssessmentAttempt.find({ candidateId, status: "completed" })
      .select("assessmentId percentage skillScores strengths improvements completedAt")
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();
  }

  return view;
}
