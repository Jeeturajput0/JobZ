// Central platform constants. Adding a new role/permission/status here keeps
// the API, database and UI in sync without scattering magic strings.

export const SYSTEM_ROLES = [
  "jobSeeker",
  "employer", // company admin / owner (backward compatible with legacy data)
  "companyMember",
  "counselingAdmin",
  "counselingMember",
  "admin", // super admin
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const ROLE_SCOPES = ["platform", "company", "counseling", "self"] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

export const ROLE_LABELS: Record<SystemRole, string> = {
  jobSeeker: "Candidate",
  employer: "Company Admin",
  companyMember: "Company Team Member",
  counselingAdmin: "Counseling Admin",
  counselingMember: "Counseling Team Member",
  admin: "Super Admin",
};

/** Dashboard URL segment for each system role. */
export const ROLE_DASHBOARD: Record<SystemRole, string> = {
  jobSeeker: "/profile",
  employer: "/company/dashboard",
  companyMember: "/company/dashboard",
  counselingAdmin: "/counseling/dashboard",
  counselingMember: "/counseling/dashboard",
  admin: "/admin/dashboard",
};

export interface PermissionDefinition {
  key: string;
  label: string;
  group: string;
  scopes: RoleScope[];
  sensitive?: boolean;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // Platform / super admin
  { key: "platform.users.view", label: "View users", group: "Platform", scopes: ["platform"] },
  { key: "platform.users.manage", label: "Manage users", group: "Platform", scopes: ["platform"] },
  { key: "platform.users.suspend", label: "Suspend / activate users", group: "Platform", scopes: ["platform"] },
  { key: "platform.roles.view", label: "View roles", group: "Platform", scopes: ["platform"] },
  { key: "platform.roles.manage", label: "Manage roles", group: "Platform", scopes: ["platform"] },
  { key: "platform.permissions.view", label: "View permissions", group: "Platform", scopes: ["platform"] },
  { key: "platform.analytics.view", label: "View platform analytics", group: "Platform", scopes: ["platform"] },
  { key: "platform.activity.view", label: "View audit logs", group: "Platform", scopes: ["platform"] },
  { key: "platform.settings.view", label: "View platform settings", group: "Platform", scopes: ["platform"] },
  { key: "platform.settings.manage", label: "Manage platform settings", group: "Platform", scopes: ["platform"] },
  { key: "platform.jobs.approve", label: "Approve / reject jobs", group: "Platform", scopes: ["platform"] },
  { key: "platform.companies.manage", label: "Manage companies", group: "Platform", scopes: ["platform"] },
  { key: "platform.verification.manage", label: "Manage all verifications", group: "Platform", scopes: ["platform"] },
  { key: "platform.notifications.manage", label: "Manage notifications", group: "Platform", scopes: ["platform"] },

  // Company
  { key: "company.profile.view", label: "View company profile", group: "Company", scopes: ["company"] },
  { key: "company.profile.manage", label: "Manage company profile", group: "Company", scopes: ["company"] },
  { key: "company.dashboard.view", label: "View dashboard", group: "Company", scopes: ["company"] },
  { key: "company.jobs.view", label: "View jobs", group: "Company", scopes: ["company"] },
  { key: "company.jobs.create", label: "Create jobs", group: "Company", scopes: ["company"] },
  { key: "company.jobs.edit", label: "Edit jobs", group: "Company", scopes: ["company"] },
  { key: "company.jobs.delete", label: "Delete jobs", group: "Company", scopes: ["company"] },
  { key: "company.jobs.publish", label: "Publish jobs", group: "Company", scopes: ["company"] },
  { key: "company.applications.view", label: "View applications", group: "Company", scopes: ["company"] },
  { key: "company.candidates.view", label: "View candidates", group: "Company", scopes: ["company"] },
  { key: "company.candidates.contact", label: "Contact candidates", group: "Company", scopes: ["company"] },
  { key: "company.candidates.resume.view", label: "View resumes", group: "Company", scopes: ["company"] },
  { key: "company.candidates.resume.download", label: "Download resumes", group: "Company", scopes: ["company"], sensitive: true },
  { key: "company.candidates.education.view", label: "View candidate education", group: "Company", scopes: ["company"] },
  { key: "company.candidates.experience.view", label: "View candidate experience", group: "Company", scopes: ["company"] },
  { key: "company.candidates.skills.view", label: "View candidate skills", group: "Company", scopes: ["company"] },
  { key: "company.candidates.assessments.view", label: "View assessment results", group: "Company", scopes: ["company"] },
  { key: "company.candidates.documents.view", label: "View identity documents", group: "Company", scopes: ["company"], sensitive: true },
  { key: "company.ats.view", label: "View ATS evaluations", group: "Company", scopes: ["company"] },
  { key: "company.candidates.shortlist", label: "Shortlist candidates", group: "Company", scopes: ["company"] },
  { key: "company.candidates.reject", label: "Reject candidates", group: "Company", scopes: ["company"] },
  { key: "company.interviews.manage", label: "Manage interviews", group: "Company", scopes: ["company"] },
  { key: "company.candidates.assign", label: "Assign candidates / jobs", group: "Company", scopes: ["company"] },
  { key: "company.team.view", label: "View team members", group: "Company", scopes: ["company"] },
  { key: "company.team.manage", label: "Manage team members", group: "Company", scopes: ["company"] },
  { key: "company.roles.manage", label: "Manage company roles", group: "Company", scopes: ["company"] },
  { key: "company.analytics.view", label: "View hiring analytics", group: "Company", scopes: ["company"] },
  { key: "company.data.export", label: "Export data", group: "Company", scopes: ["company"], sensitive: true },
  { key: "company.hiringRequests.manage", label: "Manage hiring requests", group: "Company", scopes: ["company"] },
  { key: "company.partnerships.manage", label: "Manage counseling partnerships", group: "Company", scopes: ["company"] },
  { key: "company.recommendations.manage", label: "Manage candidate recommendations", group: "Company", scopes: ["company"] },
  { key: "company.placements.manage", label: "Manage placements and joining", group: "Company", scopes: ["company"] },
  { key: "company.pipeline.view", label: "View recruitment pipeline", group: "Company", scopes: ["company"] },
  { key: "company.settings.manage", label: "Manage company settings", group: "Company", scopes: ["company"] },

  // Counseling
  { key: "counseling.dashboard.view", label: "View dashboard", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.candidates.view", label: "View assigned candidates", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.candidates.viewAll", label: "View all candidates", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.candidates.edit", label: "Edit candidate profiles", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.profileCompletion.view", label: "View profile completion", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.documents.review", label: "Review documents", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.documents.verify", label: "Verify documents", group: "Counseling", scopes: ["counseling"], sensitive: true },
  { key: "counseling.assessments.manage", label: "Manage assessments", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.assessments.viewResults", label: "View assessment results", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.candidates.search", label: "Search candidates", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.candidates.match", label: "Match candidates to jobs", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.recommendations.manage", label: "Recommend candidates", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.hiringRequests.view", label: "View hiring requests", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.hiringRequests.manage", label: "Manage hiring requests", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.applications.view", label: "View applications", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.contact.candidates", label: "Contact candidates", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.contact.companies", label: "Contact companies", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.notes.manage", label: "Manage counseling notes", group: "Counseling", scopes: ["counseling"], sensitive: true },
  { key: "counseling.team.manage", label: "Manage counseling team", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.analytics.view", label: "View counseling analytics", group: "Counseling", scopes: ["counseling"] },
  { key: "counseling.data.export", label: "Export reports", group: "Counseling", scopes: ["counseling"], sensitive: true },

  // Candidate (self service)
  { key: "candidate.profile.manage", label: "Manage own profile", group: "Candidate", scopes: ["self"] },
  { key: "candidate.documents.manage", label: "Manage own documents", group: "Candidate", scopes: ["self"] },
  { key: "candidate.assessments.take", label: "Take assessments", group: "Candidate", scopes: ["self"] },
  { key: "candidate.jobs.apply", label: "Apply to jobs", group: "Candidate", scopes: ["self"] },
  { key: "candidate.saved.manage", label: "Manage saved jobs", group: "Candidate", scopes: ["self"] },
];

export const PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key);

export const PERMISSION_GROUPS_DERIVED = Array.from(
  new Set(PERMISSION_CATALOG.map((p) => p.group)),
);

const COMPANY_ALL = PERMISSION_KEYS.filter((k) => k.startsWith("company."));
const COUNSELING_ALL = PERMISSION_KEYS.filter((k) => k.startsWith("counseling."));
const CANDIDATE_ALL = PERMISSION_KEYS.filter((k) => k.startsWith("candidate."));

/** Defaults baked into each system role. Custom roles can add or narrow these. */
export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  admin: ["*"],
  employer: [...COMPANY_ALL, ...CANDIDATE_ALL],
  companyMember: [
    "company.dashboard.view",
    "company.profile.view",
    "company.jobs.view",
    "company.applications.view",
    "company.candidates.view",
    "company.candidates.skills.view",
    "company.candidates.education.view",
    "company.candidates.experience.view",
    "company.candidates.resume.view",
  ],
  counselingAdmin: [...COUNSELING_ALL, "platform.analytics.view"],
  counselingMember: [
    "counseling.dashboard.view",
    "counseling.candidates.view",
    "counseling.profileCompletion.view",
    "counseling.candidates.search",
    "counseling.assessments.viewResults",
    "counseling.applications.view",
  ],
  jobSeeker: [...CANDIDATE_ALL],
};

export const APPLICATION_STATUSES = [
  "applied",
  "underReview",
  "atsEvaluation",
  "shortlisted",
  "interviewScheduled",
  "interviewCompleted",
  "assessmentPending",
  "selected",
  "offerReceived",
  "hired",
  "rejected",
  "withdrawn",
] as const;

// Legacy application statuses are accepted and mapped to the new pipeline.
export const LEGACY_APPLICATION_STATUSES = ["pending", "reviewed", "shortlisted", "interview", "rejected", "hired"] as const;

export const CANDIDATE_WORKFLOW_STAGES = [
  "newCandidate",
  "profileIncomplete",
  "profileReview",
  "profileEnhancement",
  "verificationPending",
  "assessmentPending",
  "assessmentCompleted",
  "jobReady",
  "jobMatching",
  "recommendedToCompany",
  "interviewScheduled",
  "selected",
  "hired",
  "onHold",
] as const;

export const VERIFICATION_STATUSES = [
  "notSubmitted",
  "pendingReview",
  "underReview",
  "verified",
  "rejected",
  "additionalInfoRequired",
] as const;

export const VERIFICATION_CATEGORIES = ["profile", "education", "employment", "skills"] as const;

export const HIRING_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "underReview",
  "assigned",
  "sourcing",
  "candidatesRecommended",
  "interviewing",
  "completed",
  "cancelled",
] as const;

export const RECOMMENDATION_STATUSES = [
  "draft",
  "recommended",
  "candidateApprovalPending",
  "candidateAccepted",
  "candidateDeclined",
  "sentToCompany",
  "companyReviewing",
  "shortlisted",
  "interviewScheduled",
  "selected",
  "rejected",
  "hired",
] as const;

export const ASSESSMENT_TYPES = [
  "aptitude",
  "logicalReasoning",
  "puzzle",
  "quiz",
  "technical",
  "programming",
  "communication",
  "domainKnowledge",
  "skillBased",
  "situational",
  "careerGoal",
] as const;

export const MATCH_WEIGHTS_DEFAULT = {
  skills: 40,
  experience: 20,
  education: 10,
  location: 10,
  careerPreference: 10,
  assessment: 10,
};

/** Settings seeded on first boot and editable by super admins. */
export const DEFAULT_PLATFORM_SETTINGS: Record<string, unknown> = {
  "matching.weights": MATCH_WEIGHTS_DEFAULT,
  "profileCompletion.weights": {
    basic: 15,
    education: 15,
    skills: 15,
    resume: 15,
    projects: 10,
    achievements: 5,
    careerGoals: 10,
    jobPreferences: 10,
    experience: 5,
  },
  "ats.version": "ats-v1",
  "ats.aiAssisted": false,
  "platform.registrationEnabled": true,
};

export const FILE_UPLOAD = {
  maxSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ],
};
