import mongoose from "mongoose";
import nextEnv from "@next/env";
import { createHash } from "node:crypto";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const seedSkills = [
  ["HTML5", "Frontend"], ["HTML", "Frontend"], ["CSS", "Frontend"], ["JavaScript", "Frontend"],
  ["TypeScript", "Frontend"], ["React.js", "Frontend"], ["React Native", "Mobile"], ["Next.js", "Frontend"],
  ["Node.js", "Backend"], ["Express.js", "Backend"], ["Python", "Programming"], ["Django", "Backend"],
  ["Java", "Programming"], ["Spring Boot", "Backend"], ["C#", "Programming"], [".NET", "Backend"],
  ["C++", "Programming"], ["Go", "Programming"], ["PHP", "Programming"], ["Laravel", "Backend"],
  ["Ruby", "Programming"], ["Ruby on Rails", "Backend"], ["SQL", "Database"], ["PostgreSQL", "Database"],
  ["MySQL", "Database"], ["MongoDB", "Database"], ["Redis", "Database"], ["GraphQL", "Backend"],
  ["REST APIs", "Backend"], ["AWS", "Cloud"], ["Microsoft Azure", "Cloud"], ["Google Cloud", "Cloud"],
  ["Docker", "DevOps"], ["Kubernetes", "DevOps"], ["Git", "Tools"], ["GitHub Actions", "DevOps"],
  ["Figma", "Design"], ["UI Design", "Design"], ["UX Research", "Design"], ["Product Management", "Product"],
  ["Data Analysis", "Data"], ["Data Science", "Data"], ["Machine Learning", "Data"], ["TensorFlow", "Data"],
  ["Pandas", "Data"], ["Excel", "Tools"], ["Project Management", "Operations"], ["Agile", "Operations"],
  ["SEO", "Marketing"], ["Content Marketing", "Marketing"], ["Salesforce", "Sales"], ["Customer Support", "Support"],
];

function normalizedName(value) { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US"); }
function slugFor(key) {
  const base = key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "skill";
  const suffix = createHash("sha1").update(key).digest("hex").slice(0, 7);
  return `${base.slice(0, 64)}-${suffix}`;
}

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI was not found in .env.local or the environment.");
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const skills = db.collection("skills");
const jobSkills = db.collection("jobskills");
const userSkills = db.collection("userskills");

await Promise.all([
  skills.createIndex({ normalizedName: 1 }, { unique: true }),
  skills.createIndex({ slug: 1 }, { unique: true }),
  skills.createIndex({ category: 1, name: 1 }),
  jobSkills.createIndex({ jobId: 1, skillId: 1 }, { unique: true }),
  jobSkills.createIndex({ skillId: 1, jobId: 1 }),
  userSkills.createIndex({ userId: 1, skillId: 1 }, { unique: true }),
  userSkills.createIndex({ skillId: 1, userId: 1 }),
]);

async function ensureSkill(nameInput, category = "General") {
  const name = nameInput.trim().replace(/\s+/g, " ");
  if (!name || name.length > 80) return null;
  const key = normalizedName(name);
  await skills.updateOne(
    { normalizedName: key },
    { $setOnInsert: { name, normalizedName: key, category, slug: slugFor(key), createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true },
  );
  return skills.findOne({ normalizedName: key }, { projection: { _id: 1, name: 1 } });
}

for (const [name, category] of seedSkills) await ensureSkill(name, category);

let migratedJobLinks = 0;
for (const job of await db.collection("jobs").find({ skills: { $type: "array" } }, { projection: { skills: 1 } }).toArray()) {
  const docs = await Promise.all(job.skills.filter((name) => typeof name === "string").map((name) => ensureSkill(name)));
  const ids = docs.filter(Boolean).map((skill) => skill._id);
  if (ids.length) {
    await jobSkills.bulkWrite(ids.map((skillId) => ({ updateOne: { filter: { jobId: job._id, skillId }, update: { $setOnInsert: { jobId: job._id, skillId, createdAt: new Date(), updatedAt: new Date() } }, upsert: true } })));
    migratedJobLinks += ids.length;
  }
}

let migratedUserLinks = 0;
for (const profile of await db.collection("jobseekerprofiles").find({ skills: { $type: "array" } }, { projection: { userId: 1, skills: 1 } }).toArray()) {
  const docs = await Promise.all(profile.skills.filter((name) => typeof name === "string").map((name) => ensureSkill(name)));
  const ids = docs.filter(Boolean).map((skill) => skill._id);
  if (ids.length) {
    await userSkills.bulkWrite(ids.map((skillId) => ({ updateOne: { filter: { userId: profile.userId, skillId }, update: { $setOnInsert: { userId: profile.userId, skillId, createdAt: new Date(), updatedAt: new Date() } }, upsert: true } })));
    migratedUserLinks += ids.length;
  }
}

const skillCount = await skills.countDocuments();
console.log(`Skills ready: ${skillCount}; job links migrated: ${migratedJobLinks}; profile links migrated: ${migratedUserLinks}.`);
await mongoose.disconnect();
