import { createHash } from "node:crypto";
import mongoose, { Types } from "mongoose";
import Job from "@/models/Job";
import JobSkill from "@/models/JobSkill";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import Skill from "@/models/Skill";
import UserSkill from "@/models/UserSkill";

export const MAX_SKILLS = 20;
type SkillRef = { _id: Types.ObjectId; name: string };

export function normalizeSkillName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function skillKey(name: string) {
  return normalizeSkillName(name).toLocaleLowerCase("en-US");
}

function skillSlug(normalizedName: string) {
  const base = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "skill";
  const suffix = createHash("sha1").update(normalizedName).digest("hex").slice(0, 7);
  return `${base.slice(0, 64)}-${suffix}`;
}

export async function getOrCreateSkill(nameInput: string, category = "General") {
  const name = normalizeSkillName(nameInput);
  if (!name || name.length > 80) throw new Error("Skill names must be between 1 and 80 characters.");
  const normalizedName = skillKey(name);
  try {
    return await Skill.findOneAndUpdate(
      { normalizedName },
      { $setOnInsert: { name, normalizedName, category: normalizeSkillName(category) || "General", slug: skillSlug(normalizedName) } },
      { new: true, upsert: true, runValidators: true },
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      const existing = await Skill.findOne({ normalizedName });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function resolveSkillIds(ids: unknown) {
  if (!Array.isArray(ids) || ids.length > MAX_SKILLS || !ids.every((id) => typeof id === "string" && Types.ObjectId.isValid(id))) {
    throw new Error(`Select up to ${MAX_SKILLS} valid skills.`);
  }
  const uniqueIds = [...new Set(ids as string[])];
  const skills = await Skill.find({ _id: { $in: uniqueIds } }).sort({ name: 1 });
  if (skills.length !== uniqueIds.length) throw new Error("One or more selected skills are no longer available.");
  return skills;
}

export async function resolveLegacySkillNames(names: unknown) {
  if (!Array.isArray(names) || !names.every((name) => typeof name === "string")) {
    throw new Error("Skills must be an array of names or skill IDs.");
  }
  const normalized = [...new Set((names as string[]).map(normalizeSkillName).filter((name) => name.length > 0 && name.length <= 80))];
  return Promise.all(normalized.map((name) => getOrCreateSkill(name)));
}

export async function replaceJobSkills(jobId: string | Types.ObjectId, skills: SkillRef[]) {
  const ids = skills.map((skill) => skill._id);
  if (ids.length) {
    await JobSkill.bulkWrite(ids.map((skillId) => ({ updateOne: { filter: { jobId, skillId }, update: { $setOnInsert: { jobId, skillId } }, upsert: true } })));
  }
  await JobSkill.deleteMany({ jobId, skillId: { $nin: ids } });
  await Job.updateOne({ _id: jobId }, { $set: { skills: skills.map((skill) => skill.name) } });
}

export async function replaceUserSkills(userId: string | Types.ObjectId, skills: SkillRef[]) {
  const ids = skills.map((skill) => skill._id);
  if (ids.length) {
    await UserSkill.bulkWrite(ids.map((skillId) => ({ updateOne: { filter: { userId, skillId }, update: { $setOnInsert: { userId, skillId } }, upsert: true } })));
  }
  await UserSkill.deleteMany({ userId, skillId: { $nin: ids } });
  await JobSeekerProfile.findOneAndUpdate(
    { userId },
    { $set: { skills: skills.map((skill) => skill.name) } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function getJobSkills(jobId: string | Types.ObjectId, legacyNames: string[] = []) {
  const names = legacyNames.filter((name) => typeof name === "string" && name.trim());
  const legacy = names.length ? await resolveLegacySkillNames(names) : [];
  if (legacy.length) {
    await JobSkill.bulkWrite(legacy.map((skill) => ({ updateOne: { filter: { jobId, skillId: skill._id }, update: { $setOnInsert: { jobId, skillId: skill._id } }, upsert: true } })));
  }
  const rows = await JobSkill.find({ jobId }).select("skillId").lean();
  const ids = [...new Set([...rows.map((row) => String(row.skillId)), ...legacy.map((skill) => String(skill._id))])];
  return Skill.find({ _id: { $in: ids } }).sort({ name: 1 });
}

export async function getUserSkills(userId: string | Types.ObjectId) {
  const profile = await JobSeekerProfile.findOne({ userId }).select("skills").lean();
  const names = (profile?.skills || []).filter((name): name is string => typeof name === "string" && Boolean(name.trim()));
  const legacy = names.length ? await resolveLegacySkillNames(names) : [];
  if (legacy.length) {
    await UserSkill.bulkWrite(legacy.map((skill) => ({ updateOne: { filter: { userId, skillId: skill._id }, update: { $setOnInsert: { userId, skillId: skill._id } }, upsert: true } })));
  }
  const rows = await UserSkill.find({ userId }).select("skillId").lean();
  const ids = [...new Set([...rows.map((row) => String(row.skillId)), ...legacy.map((skill) => String(skill._id))])];
  return Skill.find({ _id: { $in: ids } }).sort({ name: 1 });
}

export function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}
