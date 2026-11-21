import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Company from "@/models/Company";
import EmployerProfile from "@/models/EmployerProfile";
import User from "@/models/User";
import Job from "@/models/Job";
import Application from "@/models/Application";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import type { Session } from "@/lib/session";

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "company"
  );
}

/** Creates a Company row for legacy employer accounts on first access. */
export async function ensureCompanyForOwner(userId: string) {
  await connectDB();
  let company = await Company.findOne({ ownerId: userId });
  let profile = await EmployerProfile.findOne({ userId }).lean();
  if (company && !company.employerProfileId) {
    // Backfill legacy rows created before EmployerProfile provisioning.
    if (!profile) {
      profile = await EmployerProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        companyName: company.name,
        verificationStatus: company.verificationStatus,
      });
    }
    company.employerProfileId = profile._id;
    await company.save();
  }
  if (!company) {
    const user = await User.findById(userId).select("fullName").lean();
    const name = (profile as { companyName?: string })?.companyName || user?.fullName || "My Company";
    if (!profile) {
      profile = await EmployerProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        companyName: name,
        verificationStatus: "pending",
      });
    }
    const slug = `${slugify(name)}-${userId.slice(-6)}`;
    company = await Company.create({
      name,
      slug,
      ownerId: userId,
      employerProfileId: String(profile._id),
      description: (profile as { description?: string })?.description || "",
      industry: (profile as { industry?: string })?.industry || "",
      website: (profile as { website?: string })?.website || "",
      logo: (profile as { companyLogo?: string })?.companyLogo || "",
    });
    await User.findByIdAndUpdate(userId, { $set: { companyId: company._id } });
  }
  return company;
}

/** Resolve the company id for a company-scoped session, creating it if needed. */
export async function resolveCompanyId(session: Session): Promise<string | null> {
  if (session.companyId) return session.companyId;
  if (session.role === "employer") {
    const company = await ensureCompanyForOwner(session.userId);
    return String(company._id);
  }
  return null;
}

/**
 * Strict company-owned job filter. Job.companyId references EmployerProfile
 * (not Company), so we resolve the real profile id instead of trusting a
 * Company id passed from the client.
 */
export async function getCompanyJobFilter(companyId: string): Promise<Record<string, unknown>> {
  const company = await Company.findById(companyId).select("employerProfileId ownerId").lean();
  const clauses: Record<string, unknown>[] = [];
  if (company?.employerProfileId) clauses.push({ companyId: company.employerProfileId });
  if (company?.ownerId) clauses.push({ employerId: company.ownerId });
  return clauses.length ? { $or: clauses } : { companyId: "__none__" };
}

/** Candidate ids a company is legitimately allowed to view. */
export async function getCompanyCandidateIds(companyId: string) {
  await connectDB();
  const jobs = await Job.find(await getCompanyJobFilter(companyId)).select("_id").lean();
  const jobIds = jobs.map((j) => j._id);
  const [applicants, recommended] = await Promise.all([
    Application.find({ jobId: { $in: jobIds } }).select("jobSeekerId").lean(),
    CandidateRecommendation.find({ companyId }).select("candidateId").lean(),
  ]);
  return Array.from(
    new Set<string>([
      ...applicants.map((a) => String(a.jobSeekerId)),
      ...recommended.map((r) => String(r.candidateId)),
    ]),
  );
}
