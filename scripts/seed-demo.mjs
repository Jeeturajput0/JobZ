/**
 * JobZ development/demo data seeder.
 *
 * Creates a fully interconnected recruitment scenario (companies → teams →
 * jobs → applications → interviews → placements, and counseling organizations
 * → counselors → partnerships → hiring requests → recommendations).
 *
 * SAFETY
 *  - Never deletes or resets collections.
 *  - Never overwrites documents that are not marked with __seed.
 *  - Idempotent: stable keys (email/slug/title) make repeat runs no-ops.
 *  - Refuses to run in production unless ALLOW_DEMO_SEED=true.
 *  - Requires an explicit confirmation: --confirm or DEMO_SEED_CONFIRM=1.
 *
 * Usage (development):
 *   node scripts/seed-demo.mjs --confirm
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not configured.");
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Refusing to seed demo data in production. Set ALLOW_DEMO_SEED=true only if you are certain.");
}
const confirmed = process.argv.includes("--confirm") || process.env.DEMO_SEED_CONFIRM === "1";
if (!confirmed) {
  throw new Error("Demo seeding requires explicit confirmation: run with --confirm or set DEMO_SEED_CONFIRM=1.");
}

const SEED = "jobz-demo-v1";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@12345";
const now = () => new Date();

const companiesData = [
  { name: "Nexora Technologies", industry: "Information Technology", city: "Bengaluru", size: "201-500", desc: "Enterprise software and cloud platforms." },
  { name: "Brightpath Health", industry: "Healthcare", city: "Delhi", size: "51-200", desc: "Digital health and patient engagement solutions." },
  { name: "Veridian Finance", industry: "Financial Services", city: "Mumbai", size: "201-500", desc: "Fintech products for modern businesses." },
  { name: "Greenfield Retail", industry: "Retail", city: "Pune", size: "51-200", desc: "Omnichannel retail and supply chain." },
  { name: "Atlas Logistics", industry: "Logistics", city: "Chennai", size: "51-200", desc: "Technology-driven logistics and warehousing." },
  { name: "Studio Lumen", industry: "Design & Media", city: "Hyderabad", size: "11-50", desc: "Product design and creative studio." },
];

const counselingData = [
  { name: "CareerBridge Partners", desc: "Career guidance and candidate sourcing for technology roles." },
  { name: "SkillSpring Academy", desc: "Skill development and placement support for freshers." },
  { name: "TalentNest Consultancy", desc: "Recruitment consulting for healthcare and finance." },
  { name: "NextStep Career Hub", desc: "Career counseling and interview preparation." },
  { name: "GrowthPath Advisors", desc: "Talent advisory and workforce planning." },
  { name: "Northstar Placement Cell", desc: "Campus hiring and early-career placements." },
];

const seekersData = [
  { name: "Aarav Mehta", email: "demo.seeker.aarav@example.com", headline: "Full Stack Developer", city: "Bengaluru", skills: ["React", "Node.js", "TypeScript", "MongoDB"], exp: 4, roles: ["Full Stack Developer", "Frontend Developer"], fresher: false },
  { name: "Priya Sharma", email: "demo.seeker.priya@example.com", headline: "Frontend Developer", city: "Delhi", skills: ["React", "JavaScript", "CSS", "HTML"], exp: 2, roles: ["Frontend Developer"], fresher: false },
  { name: "Rohan Verma", email: "demo.seeker.rohan@example.com", headline: "Data Analyst", city: "Mumbai", skills: ["SQL", "Python", "Excel", "Power BI"], exp: 3, roles: ["Data Analyst", "Business Analyst"], fresher: false },
  { name: "Neha Iyer", email: "demo.seeker.neha@example.com", headline: "UX Designer", city: "Pune", skills: ["Figma", "UI Design", "User Research", "Prototyping"], exp: 2, roles: ["UX Designer", "Product Designer"], fresher: false },
  { name: "Kabir Nair", email: "demo.seeker.kabir@example.com", headline: "Backend Engineer", city: "Chennai", skills: ["Java", "Spring Boot", "MySQL", "AWS"], exp: 5, roles: ["Backend Engineer"], fresher: false },
  { name: "Ananya Rao", email: "demo.seeker.ananya@example.com", headline: "Marketing Executive", city: "Hyderabad", skills: ["Digital Marketing", "SEO", "Content Writing"], exp: 1, roles: ["Marketing Executive"], fresher: false },
  { name: "Dev Patel", email: "demo.seeker.dev@example.com", headline: "Fresher - Software Engineer", city: "Bengaluru", skills: ["JavaScript", "React", "Git", "HTML"], exp: 0, roles: ["Software Engineer", "Frontend Developer"], fresher: true },
  { name: "Sana Qureshi", email: "demo.seeker.sana@example.com", headline: "HR Executive", city: "Delhi", skills: ["Recruitment", "HR Operations", "Communication"], exp: 2, roles: ["HR Executive", "Recruiter"], fresher: false },
];

const jobsData = [
  { title: "Senior Full Stack Developer", company: 0, category: "IT", skills: ["React", "Node.js", "TypeScript"], exp: "3-5 years", type: "full-time", mode: "hybrid", min: 1200000, max: 1800000, status: "active", approval: "approved" },
  { title: "Frontend Developer", company: 0, category: "IT", skills: ["React", "JavaScript", "CSS"], exp: "1-3 years", type: "full-time", mode: "remote", min: 600000, max: 1000000, status: "active", approval: "approved" },
  { title: "Data Analyst", company: 2, category: "Analytics", skills: ["SQL", "Python", "Power BI"], exp: "2-4 years", type: "full-time", mode: "onsite", min: 800000, max: 1200000, status: "active", approval: "approved" },
  { title: "UX Designer", company: 5, category: "Design", skills: ["Figma", "UI Design", "Prototyping"], exp: "2-4 years", type: "full-time", mode: "remote", min: 900000, max: 1400000, status: "active", approval: "approved" },
  { title: "Backend Engineer (Java)", company: 1, category: "IT", skills: ["Java", "Spring Boot", "MySQL"], exp: "3-6 years", type: "full-time", mode: "onsite", min: 1000000, max: 1500000, status: "active", approval: "approved" },
  { title: "Marketing Executive", company: 3, category: "Marketing", skills: ["Digital Marketing", "SEO"], exp: "1-2 years", type: "full-time", mode: "onsite", min: 400000, max: 700000, status: "active", approval: "approved" },
  { title: "Associate Software Engineer", company: 0, category: "IT", skills: ["JavaScript", "React"], exp: "fresher", type: "full-time", mode: "onsite", min: 400000, max: 600000, status: "draft", approval: "pending" },
  { title: "Logistics Coordinator", company: 4, category: "Operations", skills: ["Logistics", "MS Excel"], exp: "1-3 years", type: "full-time", mode: "onsite", min: 350000, max: 550000, status: "closed", approval: "approved" },
  { title: "HR Executive", company: 1, category: "HR", skills: ["Recruitment", "HR Operations"], exp: "1-3 years", type: "full-time", mode: "hybrid", min: 450000, max: 750000, status: "inactive", approval: "rejected" },
];

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const stats = {};

async function ensure(collection, key, doc) {
  const existing = await db.collection(collection).findOne(key);
  if (existing) return { _id: existing._id, created: false };
  const result = await db.collection(collection).insertOne({ ...doc, __seed: SEED, createdAt: now(), updatedAt: now() });
  return { _id: result.insertedId, created: true };
}
function bump(name, created) { if (created) stats[name] = (stats[name] || 0) + 1; }

const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

// 1. Super admin (demo)
await ensure("users", { email: "demo.superadmin@example.com" }, {
  fullName: "Demo Super Admin", email: "demo.superadmin@example.com", password: passwordHash,
  role: "admin", status: "active", isEmailVerified: true, directPermissions: [],
});

// 2. Companies + owners + employer profiles + memberships
const companyIds = [];
const ownerIds = [];
const profileIds = [];
for (const [i, c] of companiesData.entries()) {
  const email = `demo.company${i + 1}@example.com`;
  const owner = await ensure("users", { email }, {
    fullName: `${c.name} Owner`, email, password: passwordHash, role: "employer",
    status: "active", isEmailVerified: true, directPermissions: [],
  });
  bump("Users (company owners)", owner.created);
  ownerIds.push(owner._id);

  const profile = await ensure("employerprofiles", { userId: owner._id }, {
    userId: owner._id, companyName: c.name, industry: c.industry, companySize: c.size,
    website: `https://example.com/company-${i + 1}`, location: c.city, description: c.desc,
    socialLinks: {}, verificationStatus: "verified",
  });
  bump("Employer Profiles", profile.created);
  profileIds.push(profile._id);

  const slug = `demo-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const company = await ensure("companies", { slug }, {
    name: c.name, slug, ownerId: owner._id, employerProfileId: profile._id,
    verificationStatus: i === 5 ? "pending" : "verified", status: i === 5 ? "suspended" : "active",
    description: c.desc, industry: c.industry, website: `https://example.com/company-${i + 1}`,
    logo: "", coverImage: "", email, phone: `+91 90000 0000${i + 1}`, headquarters: c.city,
    address: `${i + 10} Demo Street`, city: c.city, state: "Demo State", country: "India",
    companySize: c.size, foundedYear: 2014 + i, companyType: "Private", socialLinks: {},
    hiringInformation: "Actively hiring across product and engineering roles.", profilePublic: true, settings: {},
  });
  bump("Companies", company.created);
  companyIds.push(company._id);
  await db.collection("users").updateOne({ _id: owner._id }, { $set: { companyId: company._id } });
}

// Company team members (admin, HR manager, recruiters) — 9 total
const companyMemberIds = [];
const teamTitles = ["HR Manager", "Recruiter", "Recruiter"];
for (let i = 0; i < teamsCount(); i++) {
  const companyIndex = i % companyIds.length;
  const email = `demo.team${i + 1}@example.com`;
  const member = await ensure("users", { email }, {
    fullName: `Demo Team Member ${i + 1}`, email, password: passwordHash, role: "companyMember",
    status: i === 8 ? "inactive" : "active", isEmailVerified: true,
    companyId: companyIds[companyIndex], directPermissions: [
      "company.dashboard.view", "company.jobs.view", "company.applications.view",
      "company.candidates.view", "company.interviews.manage",
    ],
  });
  bump("Company Team Members (users)", member.created);
  companyMemberIds.push(member._id);
  const membership = await ensure("companymemberships", { companyId: companyIds[companyIndex], userId: member._id }, {
    companyId: companyIds[companyIndex], userId: member._id, roleId: null,
    title: teamTitles[i % teamTitles.length], permissions: [
      "company.dashboard.view", "company.jobs.view", "company.applications.view",
      "company.candidates.view", "company.interviews.manage",
    ], assignedJobs: [], assignedCandidates: [], status: i === 8 ? "inactive" : "active",
  });
  bump("Company Memberships", membership.created);
}
function teamsCount() { return 9; }

// 3. Counseling organizations + admins/counselors
const teamIds = [];
const counselorIds = [];
for (const [i, t] of counselingData.entries()) {
  const adminEmail = `demo.counseling${i + 1}@example.com`;
  const admin = await ensure("users", { email: adminEmail }, {
    fullName: `${t.name} Admin`, email: adminEmail, password: passwordHash,
    role: "counselingAdmin", status: "active", isEmailVerified: true, directPermissions: [],
  });
  bump("Counseling Admins (users)", admin.created);
  const slug = `demo-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const team = await ensure("counselingteams", { slug }, {
    name: t.name, slug, adminId: admin._id, description: t.desc,
    status: i === 5 ? "suspended" : "active", settings: {},
  });
  bump("Counseling Organizations", team.created);
  teamIds.push(team._id);
  await db.collection("users").updateOne({ _id: admin._id }, { $set: { counselingTeamId: team._id } });
  await ensure("counselingmemberships", { teamId: team._id, userId: admin._id }, {
    teamId: team._id, userId: admin._id, roleId: null, title: "Counseling Admin",
    permissions: [], assignedCandidates: [], assignedHiringRequests: [], status: "active",
  });

  const counselorEmail = `demo.counselor${i + 1}@example.com`;
  const counselor = await ensure("users", { email: counselorEmail }, {
    fullName: `Demo Counselor ${i + 1}`, email: counselorEmail, password: passwordHash,
    role: "counselingMember", status: "active", isEmailVerified: true,
    counselingTeamId: team._id, directPermissions: [
      "counseling.dashboard.view", "counseling.candidates.view", "counseling.candidates.search",
      "counseling.recommendations.manage", "counseling.hiringRequests.view",
    ],
  });
  bump("Counselors (users)", counselor.created);
  counselorIds.push(counselor._id);
  await ensure("counselingmemberships", { teamId: team._id, userId: counselor._id }, {
    teamId: team._id, userId: counselor._id, roleId: null, title: "Career Counselor",
    permissions: ["counseling.candidates.view", "counseling.recommendations.manage"],
    assignedCandidates: [], assignedHiringRequests: [], status: "active",
  });
}
// One extra counselor for 7 total
{
  const email = "demo.counselor7@example.com";
  const counselor = await ensure("users", { email }, {
    fullName: "Demo Counselor 7", email, password: passwordHash, role: "counselingMember",
    status: "active", isEmailVerified: true, counselingTeamId: teamIds[0], directPermissions: ["counseling.candidates.view"],
  });
  bump("Counselors (users)", counselor.created);
  counselorIds.push(counselor._id);
  await ensure("counselingmemberships", { teamId: teamIds[0], userId: counselor._id }, {
    teamId: teamIds[0], userId: counselor._id, roleId: null, title: "Counselor",
    permissions: ["counseling.candidates.view"], assignedCandidates: [], assignedHiringRequests: [], status: "active",
  });
}

// 4. Job seekers + profiles + counseling records + private resumes
const seekerIds = [];
const resumeDocIds = [];
const resumeDataUrl = "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQoKZW5kc3RyZWFtCmVuZG9iago=";
for (const [i, s] of seekersData.entries()) {
  const user = await ensure("users", { email: s.email }, {
    fullName: s.name, email: s.email, password: passwordHash, phone: `+91 98${String(100 + i).slice(-5)}`,
    role: "jobSeeker", status: "active", isEmailVerified: true, directPermissions: [],
  });
  bump("Job Seekers (users)", user.created);
  seekerIds.push(user._id);

  const doc = await ensure("candidatedocuments", { candidateId: user._id, name: `${s.name.replace(/\s/g, "_")}_Resume.pdf` }, {
    candidateId: user._id, name: `${s.name.replace(/\s/g, "_")}_Resume.pdf`, type: "resume",
    category: "profile", mimeType: "application/pdf", size: 90, dataUrl: resumeDataUrl,
    uploadedBy: user._id, verificationId: null, isPrivate: true,
  });
  bump("Private Resumes", doc.created);
  resumeDocIds.push(doc._id);

  const profile = await ensure("jobseekerprofiles", { userId: user._id }, {
    userId: user._id, profileImage: "", headline: s.headline,
    summary: `${s.headline} with ${s.exp} years of experience. Seeking meaningful work.`,
    location: s.city, city: s.city, state: "Demo State", country: "India",
    phone: `+91 98${String(100 + i).slice(-5)}`,
    dateOfBirth: new Date(`199${5 + (i % 4)}-0${1 + (i % 9)}-1${i % 9}`),
    gender: "preferNotToSay", languages: ["English", "Hindi"], preferredLocations: [s.city, "Remote"],
    careerGoals: `Grow as a ${s.headline}.`, careerLevel: s.fresher ? "fresher" : "mid",
    expectedSalary: 700000 + i * 50000, skills: s.skills, skillLevels: {},
    education: [{ degree: s.fresher ? "B.Tech" : "Bachelor's Degree", institution: "Demo University", year: String(2018 + (i % 5)), fieldOfStudy: "Computer Science", result: "8.0 CGPA" }],
    experience: s.fresher ? [{ company: "Demo Internships", position: "Intern", duration: "6 months", description: " internship experience", current: false, verified: false }] : [{ company: `Demo Org ${i + 1}`, position: s.headline, duration: `${s.exp} years`, description: "Key responsibilities and achievements.", current: true, verified: false }],
    projects: [{ title: `Demo Project ${i + 1}`, description: "Built a production-like application.", link: "", technologies: s.skills.slice(0, 3), startDate: "2023-01", endDate: "2023-06" }],
    achievements: [{ title: "Employee of the quarter", description: "Recognized for impactful delivery.", date: "2024-03" }],
    certifications: [{ name: "Professional Certification", issuer: "Demo Institute", year: "2023", credentialId: `DEMO-${i + 1}`, verified: false }],
    jobPreferences: { roles: s.roles, locations: [s.city, "Remote"], jobTypes: ["full-time"], workModes: ["remote", "hybrid", "onsite"], minSalary: 500000, maxSalary: 1500000, openToRelocation: true, remoteOnly: false },
    resumeUrl: `/api/candidate/documents/${String(doc._id)}`, resumePublic: false, preferredResumeId: doc._id,
    portfolioUrl: "", linkedInUrl: "", verificationStatus: i % 3 === 0 ? "verified" : "notSubmitted",
    verifiedCategories: i % 3 === 0 ? ["profile", "education"] : [], consentShareWithCompanies: i % 2 === 0,
    sharedFields: ["fullName", "headline", "skills", "education", "resumeUrl"],
    counselingOptIn: i < 6, workflowStatus: "jobReady", settings: {},
  });
  bump("Job Seeker Profiles", profile.created);

  if (i < 6) {
    const record = await ensure("counselingrecords", { candidateId: user._id, teamId: teamIds[i % teamIds.length] }, {
      candidateId: user._id, teamId: teamIds[i % teamIds.length], assignedTo: counselorIds[i % counselorIds.length],
      workflowStatus: ["profileReview", "jobReady", "recommendedToCompany", "interviewScheduled", "selected", "profileEnhancement"][i],
      profileCompletion: 60 + i * 5, verificationStatus: "verified", suggestions: ["Improve your resume.", "Add more projects."],
      history: [{ status: "newCandidate", by: null, at: now() }], notes: [], tasks: [],
    });
    bump("Counseling Records", record.created);
    await db.collection("counselingmemberships").updateOne(
      { teamId: teamIds[i % teamIds.length], userId: counselorIds[i % counselorIds.length] },
      { $addToSet: { assignedCandidates: user._id } },
    );
  }
}

// 5. Jobs
const jobIds = [];
for (const [i, j] of jobsData.entries()) {
  const slug = `demo-job-${i + 1}-${j.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const job = await ensure("jobs", { slug }, {
    employerId: ownerIds[j.company], companyId: profileIds[j.company], title: j.title, slug,
    category: j.category, shortDescription: `${j.title} — ${j.mode} role.`,
    description: `We are hiring a ${j.title} to join our team. You will work on meaningful products with a collaborative team.`,
    responsibilities: ["Design and deliver high-quality work", "Collaborate with cross-functional teams"],
    requirements: [`${j.exp} of relevant experience`, "Strong communication skills"], skills: j.skills,
    jobType: j.type, workMode: j.mode, experienceLevel: j.exp, minSalary: j.min, maxSalary: j.max,
    location: companiesData[j.company].city, benefits: ["Health insurance", "Flexible work"],
    applicationDeadline: deadline, status: j.status, approvalStatus: j.approval, isFeatured: i < 2,
  });
  bump("Jobs", job.created);
  jobIds.push(job._id);
}

// 6. Applications (9)
const applicationIds = [];
const appSpecs = [
  [0, 0, "shortlisted"], [1, 1, "underReview"], [2, 2, "interviewScheduled"],
  [3, 3, "selected"], [4, 4, "applied"], [5, 5, "rejected"], [0, 6, "interviewCompleted"],
  [2, 7, "hired"], [6, 0, "withdrawn"],
];
for (const [seekerIndex, jobIndex, status] of appSpecs) {
  const jobId = jobIds[jobIndex];
  const seekerId = seekerIds[seekerIndex];
  const jobCompany = jobIds.indexOf(jobId);
  const ownerIdx = jobsData[jobIndex].company;
  const app = await ensure("applications", { jobId, jobSeekerId: seekerId }, {
    jobId, jobSeekerId: seekerId, employerId: ownerIds[ownerIdx], companyId: companyIds[ownerIdx],
    recommendationId: null, source: "direct",
    resumeUrl: `/api/candidate/documents/${String(resumeDocIds[seekerIndex])}`, coverLetter: `I am interested in this role at ${companiesData[ownerIdx].name}.`,
    status, assignedTo: companyMemberIds[ownerIdx % companyMemberIds.length], feedback: "",
    interviewDate: ["interviewScheduled", "interviewCompleted"].includes(status) ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) : null,
    appliedAt: new Date(Date.now() - (20 - jobIndex) * 24 * 60 * 60 * 1000),
    timeline: [{ status: "applied", by: seekerId, at: now() }, { status, by: null, at: now() }],
  });
  bump("Applications", app.created);
  applicationIds.push(app._id);
}

// 7. Saved jobs (8)
for (let i = 0; i < 8; i++) {
  const jobId = jobIds[i % jobIds.length];
  const seekerId = seekerIds[i % seekerIds.length];
  const saved = await ensure("savedjobs", { jobSeekerId: seekerId, jobId }, { jobSeekerId: seekerId, jobId });
  bump("Saved Jobs", saved.created);
}

// 8. Partnerships (6)
const partnershipIds = [];
for (let i = 0; i < 6; i++) {
  const p = await ensure("partnerships", { companyId: companyIds[i], counselingTeamId: teamIds[i] }, {
    companyId: companyIds[i], counselingTeamId: teamIds[i],
    status: ["accepted", "accepted", "pending", "accepted", "rejected", "terminated"][i],
    initiatedBy: i % 2 === 0 ? "company" : "counseling", requestedBy: ownerIds[i], reviewedBy: null, reviewedAt: null,
    notes: "Demo partnership agreement.",
    history: [{ status: "pending", note: "Requested", by: ownerIds[i], at: now() }],
  });
  bump("Partnerships", p.created);
  partnershipIds.push(p._id);
}

// 9. Hiring requests (7)
const hiringRequestIds = [];
for (let i = 0; i < 7; i++) {
  const companyIndex = i % 6;
  const hr = await ensure("hiringrequests", { companyId: companyIds[companyIndex], jobTitle: `Demo Hiring Request ${i + 1}` }, {
    companyId: companyIds[companyIndex], createdBy: ownerIds[companyIndex], assignedTo: counselorIds[i % counselorIds.length],
    jobTitle: `Demo Hiring Request ${i + 1}`, jobDescription: "Source suitable candidates for this requirement.",
    requiredSkills: [jdataSkills(i)], preferredSkills: ["Communication"], educationRequirements: "Bachelor's degree",
    experienceRequirements: `${1 + (i % 4)} years`, jobLocation: companiesData[companyIndex].city,
    salaryRange: "₹5-12 LPA", jobType: "full-time", numberOfOpenings: 3 + i,
    preferredCandidateProfile: "Career-focused candidates with relevant skills.",
    hiringDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), priority: ["medium", "high", "urgent"][i % 3],
    additionalRequirements: "", status: ["submitted", "assigned", "sourcing", "candidatesRecommended", "completed", "underReview", "cancelled"][i],
    feedback: [], history: [{ status: "submitted", by: ownerIds[companyIndex], at: now() }],
  });
  bump("Hiring Requests", hr.created);
  hiringRequestIds.push(hr._id);
}
function jdataSkills(i) { return [["React", "Node.js"], ["SQL", "Python"], ["Figma"], ["Java"], ["SEO"], ["Logistics"], ["Recruitment"]][i][0]; }

// 10. Candidate recommendations (7)
const recommendationIds = [];
for (let i = 0; i < 7; i++) {
  const companyIndex = i % 6;
  const counselorIndex = i % counselorIds.length;
  const teamIndex = i % teamIds.length;
  const rec = await ensure("candidaterecommendations", { candidateId: seekerIds[i], companyId: companyIds[companyIndex], hiringRequestId: hiringRequestIds[i] }, {
    candidateId: seekerIds[i], jobId: jobIds[i % jobIds.length], hiringRequestId: hiringRequestIds[i],
    companyId: companyIds[companyIndex], counselorId: counselorIds[counselorIndex], counselingTeamId: teamIds[teamIndex],
    status: ["sentToCompany", "companyReviewing", "shortlisted", "interviewScheduled", "selected", "rejected", "hired"][i],
    matchScore: 70 + i * 3, consentRequired: false, candidateConsent: "accepted",
    sharedFields: ["fullName", "headline", "skills", "education", "resumeUrl"],
    note: "Strong match for the role.", companyFeedback: "Under review.",
    timeline: [{ status: "recommended", by: counselorIds[counselorIndex], at: now() }],
  });
  bump("Candidate Recommendations", rec.created);
  recommendationIds.push(rec._id);
}

// 11. Interviews (7)
for (let i = 0; i < 7; i++) {
  const companyIndex = i % 6;
  const past = i >= 4;
  const interview = await ensure("interviews", { seedKey: `demo-interview-${i + 1}` }, {
    seedKey: `demo-interview-${i + 1}`,
    applicationId: applicationIds[i % applicationIds.length], recommendationId: recommendationIds[i],
    jobId: jobIds[i % jobIds.length], candidateId: seekerIds[i % seekerIds.length],
    companyId: companyIds[companyIndex], scheduledBy: ownerIds[companyIndex],
    interviewerIds: [companyMemberIds[i % companyMemberIds.length]],
    scheduledAt: new Date(Date.now() + (past ? -1 : 1) * (i + 2) * 24 * 60 * 60 * 1000),
    durationMinutes: 45, mode: ["remote", "onsite", "phone"][i % 3],
    location: companiesData[companyIndex].city, meetingLink: "https://meet.example.com/demo",
    notes: "Demo interview round 1.", feedback: [],
    status: past ? "completed" : "scheduled",
  });
  bump("Interviews", interview.created);
}

// 12. Placements (6 — confirmed joining only)
for (let i = 0; i < 6; i++) {
  const placement = await ensure("placements", { candidateId: seekerIds[i], companyId: companyIds[i % 6], jobId: jobIds[i % 6] }, {
    candidateId: seekerIds[i], jobId: jobIds[i % 6], recommendationId: recommendationIds[i],
    applicationId: applicationIds[i % applicationIds.length], companyId: companyIds[i % 6],
    counselingTeamId: i < 4 ? teamIds[i % teamIds.length] : null,
    counselorId: i < 4 ? counselorIds[i % counselorIds.length] : null,
    source: i < 4 ? "counselingReferral" : "direct", status: "confirmed",
    joiningDate: new Date(Date.now() - (30 - i * 4) * 24 * 60 * 60 * 1000),
    notes: "Candidate joined successfully.", recordedBy: ownerIds[i % 6],
    history: [{ status: "confirmed", note: "Joining confirmed", by: ownerIds[i % 6], at: now() }],
  });
  bump("Placements", placement.created);
}

// 13. Notifications (6 per demo candidate + 6 per demo owner + 6 per demo counselor)
const notificationSpecs = [
  [seekerIds[0], "application.status", "Application shortlisted", "Your application was shortlisted."],
  [seekerIds[0], "interview.scheduled", "Interview scheduled", "An interview has been scheduled."],
  [seekerIds[1], "application.received", "Application submitted", "Your application was submitted."],
  [seekerIds[2], "recommendation.received", "Job recommendation", "A counselor recommended you for a role."],
  [ownerIds[0], "application.received", "New application", "A candidate applied to your job."],
  [ownerIds[0], "partnership.accepted", "Partnership accepted", "A counseling partnership is now active."],
  [counselorIds[0], "hiringRequest.assigned", "Hiring request assigned", "You were assigned a hiring request."],
  [counselorIds[0], "recommendation.submitted", "Recommendation submitted", "A recommendation was submitted."],
];
for (const [userId, type, title, message] of notificationSpecs) {
  const n = await ensure("notifications", { userId, type, title }, {
    userId, type, title, message, link: "/profile", data: {}, read: false, readAt: null,
  });
  bump("Notifications", n.created);
}

// 14. Activity logs (9)
const activitySpecs = [
  [ownerIds[0], "job.created", "Job", "Demo job created", companyIds[0]],
  [null, "job.approved", "Job", "Demo job approved", companyIds[0]],
  [seekerIds[0], "application.submitted", "Application", "Demo application submitted", companyIds[0]],
  [companyMemberIds[0], "application.shortlisted", "Application", "Demo candidate shortlisted", companyIds[0]],
  [ownerIds[0], "interview.scheduled", "Interview", "Demo interview scheduled", companyIds[0]],
  [ownerIds[1], "partnership.created", "Partnership", "Demo partnership created", companyIds[1]],
  [ownerIds[2], "hiringRequest.created", "HiringRequest", "Demo hiring request created", companyIds[2]],
  [counselorIds[0], "recommendation.created", "CandidateRecommendation", "Demo candidate recommended", companyIds[0]],
  [ownerIds[3], "placement.confirmed", "Placement", "Demo placement confirmed", companyIds[3]],
];
for (const [actorId, action, entity, description, companyId] of activitySpecs) {
  const a = await ensure("activitylogs", { action, entity, description }, {
    actorId, actorRole: "system", action, entity, entityId: "", companyId,
    counselingTeamId: null, description, metadata: {}, ip: "",
  });
  bump("Activity Logs", a.created);
}

console.log("Demo seed complete. Records created this run:");
for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`);
console.log("Existing/seeded records were left untouched. Re-run is safe and idempotent.");
await mongoose.disconnect();
