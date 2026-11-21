/**
 * Seeds the RBAC catalogue, system roles and platform configuration.
 * Idempotent — safe to run multiple times.
 *
 *   node scripts/seed-platform.mjs
 *
 * Optional env (also read from .env.local):
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
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

const PERMISSION_KEYS = [
  "platform.users.view", "platform.users.manage", "platform.users.suspend",
  "platform.roles.view", "platform.roles.manage", "platform.permissions.view",
  "platform.analytics.view", "platform.activity.view", "platform.settings.view",
  "platform.settings.manage", "platform.jobs.approve", "platform.companies.manage",
  "platform.verification.manage", "platform.notifications.manage",
  "company.profile.view", "company.profile.manage", "company.dashboard.view",
  "company.jobs.view", "company.jobs.create", "company.jobs.edit", "company.jobs.delete",
  "company.jobs.publish", "company.applications.view", "company.candidates.view",
  "company.candidates.contact", "company.candidates.resume.view", "company.candidates.resume.download",
  "company.candidates.education.view", "company.candidates.experience.view",
  "company.candidates.skills.view", "company.candidates.assessments.view",
  "company.candidates.documents.view", "company.ats.view", "company.candidates.shortlist",
  "company.candidates.reject", "company.interviews.manage", "company.candidates.assign",
  "company.team.view", "company.team.manage", "company.roles.manage",
  "company.analytics.view", "company.data.export", "company.hiringRequests.manage",
  "company.partnerships.manage", "company.recommendations.manage", "company.placements.manage",
  "company.pipeline.view", "company.settings.manage",
  "counseling.dashboard.view", "counseling.candidates.view", "counseling.candidates.viewAll",
  "counseling.candidates.edit", "counseling.profileCompletion.view", "counseling.documents.review",
  "counseling.documents.verify", "counseling.assessments.manage", "counseling.assessments.viewResults",
  "counseling.candidates.search", "counseling.candidates.match", "counseling.recommendations.manage",
  "counseling.hiringRequests.view", "counseling.hiringRequests.manage", "counseling.applications.view",
  "counseling.contact.candidates", "counseling.contact.companies", "counseling.notes.manage",
  "counseling.team.manage", "counseling.analytics.view", "counseling.data.export",
  "candidate.profile.manage", "candidate.documents.manage", "candidate.assessments.take",
  "candidate.jobs.apply", "candidate.saved.manage",
];

const SYSTEM_ROLES = [
  { key: "company-recruiter", name: "HR Recruiter", scope: "company", permissions: [
    "company.dashboard.view", "company.profile.view", "company.jobs.view",
    "company.applications.view", "company.candidates.view", "company.candidates.skills.view",
    "company.candidates.education.view", "company.candidates.experience.view",
    "company.candidates.resume.view", "company.ats.view",
  ] },
  { key: "company-interviewer", name: "Interviewer", scope: "company", permissions: [
    "company.dashboard.view", "company.jobs.view", "company.applications.view",
    "company.candidates.view", "company.interviews.manage",
  ] },
  { key: "counselor", name: "Candidate Counselor", scope: "counseling", permissions: [
    "counseling.dashboard.view", "counseling.candidates.view", "counseling.profileCompletion.view",
    "counseling.candidates.search", "counseling.assessments.viewResults",
    "counseling.applications.view", "counseling.notes.manage",
    "counseling.hiringRequests.view", "counseling.recommendations.manage",
  ] },
  { key: "verification-officer", name: "Verification Officer", scope: "counseling", permissions: [
    "counseling.dashboard.view", "counseling.candidates.view", "counseling.documents.review",
    "counseling.documents.verify", "counseling.profileCompletion.view",
  ] },
  { key: "job-matching-specialist", name: "Job Matching Specialist", scope: "counseling", permissions: [
    "counseling.dashboard.view", "counseling.candidates.view", "counseling.candidates.search",
    "counseling.candidates.match", "counseling.recommendations.manage",
    "counseling.hiringRequests.view", "counseling.assessments.viewResults",
  ] },
];

const SETTINGS = {
  "matching.weights": { skills: 40, experience: 20, education: 10, location: 10, careerPreference: 10, assessment: 10 },
  "profileCompletion.weights": { basic: 15, education: 15, skills: 15, resume: 15, projects: 10, achievements: 5, careerGoals: 10, jobPreferences: 10, experience: 5 },
  "ats.version": "ats-v1",
  "ats.aiAssisted": false,
  "platform.registrationEnabled": true,
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log("Connected to MongoDB:", db.databaseName);

  const permissions = db.collection("permissions");
  for (const key of PERMISSION_KEYS) {
    const group = key.split(".")[0];
    await permissions.updateOne(
      { key },
      { $setOnInsert: { key, label: key.split(".").slice(1).join(" "), group, scopes: [group === "candidate" ? "self" : group], sensitive: false } },
      { upsert: true },
    );
  }
  console.log(`Seeded ${PERMISSION_KEYS.length} permissions.`);

  const roles = db.collection("roles");
  for (const role of SYSTEM_ROLES) {
    await roles.updateOne(
      { key: role.key, scope: role.scope, scopeId: null },
      { $set: { name: role.name, permissions: role.permissions, isSystem: true, status: "active" } },
      { upsert: true },
    );
  }
  console.log(`Seeded ${SYSTEM_ROLES.length} system roles.`);

  const settings = db.collection("platformsettings");
  for (const [key, value] of Object.entries(SETTINGS)) {
    await settings.updateOne({ key }, { $set: { value, description: key } }, { upsert: true });
  }
  console.log(`Seeded ${Object.keys(SETTINGS).length} platform settings.`);

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const users = db.collection("users");
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (!existing) {
      await users.insertOne({
        fullName: process.env.SUPER_ADMIN_NAME || "Super Admin",
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        role: "admin",
        status: "active",
        isEmailVerified: true,
        directPermissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      });
      console.log("Created super admin:", email);
    } else {
      console.log("Super admin already exists:", email);
    }
  } else {
    console.log("SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super admin creation.");
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
