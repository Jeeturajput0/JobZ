import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError, readJson, cleanStringArray } from "@/lib/api";
import mongoose from "mongoose";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import CounselingRecord from "@/models/CounselingRecord";
import CounselingTeam from "@/models/CounselingTeam";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Application from "@/models/Application";
import Interview from "@/models/Interview";

const createdAtOf = (value: unknown): Date | undefined =>
  (value as { createdAt?: Date } | null)?.createdAt;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const uid = new mongoose.Types.ObjectId(auth.session.userId);
    const [profile, records, recommendations] = await Promise.all([
      JobSeekerProfile.findOne({ userId: uid }).select("consentShareWithCompanies sharedFields counselingOptIn").lean(),
      CounselingRecord.find({ candidateId: uid })
        .populate({ path: "teamId", select: "name description" })
        .populate({ path: "assignedTo", select: "fullName email" }).lean(),
      CandidateRecommendation.find({ candidateId: uid })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "counselorId", select: "fullName" })
        .sort({ createdAt: -1 }).lean(),
    ]);

    const teamIds = records.map((r) => r.teamId);
    const teams = await CounselingTeam.find({ _id: { $in: teamIds } }).select("name").lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t]));
    const recIds = recommendations.map((r) => r._id);
    const [applications, interviews] = await Promise.all([
      Application.find({ recommendationId: { $in: recIds } }).populate({ path: "jobId", select: "title" }).lean(),
      Interview.find({ recommendationId: { $in: recIds } }).populate({ path: "jobId", select: "title" }).sort({ scheduledAt: -1 }).lean(),
    ]);

    return ok({
      connected: records.length > 0,
      organizations: records.map((r) => ({
        id: String(r._id),
        name: (teamMap.get(String(r.teamId)) as { name?: string } | undefined)?.name || (r.teamId as { name?: string })?.name || "",
        counselor: (r.assignedTo as { fullName?: string } | null)?.fullName || "",
        counselorEmail: (r.assignedTo as { email?: string } | null)?.email || "",
        status: r.workflowStatus,
        profileCompletion: r.profileCompletion,
        tasks: (r.tasks || []).map((t) => ({ title: t.title, status: t.status, dueDate: t.dueDate })),
      })),
      recommendations: recommendations.map((r) => ({
        id: String(r._id),
        company: (r.companyId as { name?: string })?.name || "",
        job: (r.jobId as { title?: string })?.title || "",
        counselor: (r.counselorId as { fullName?: string })?.fullName || "",
        status: r.status,
        consent: r.candidateConsent,
        createdAt: createdAtOf(r),
      })),
      applications: applications.map((a) => ({
        id: String(a._id),
        job: (a.jobId as { title?: string })?.title || "",
        status: a.status,
        appliedAt: a.appliedAt,
      })),
      interviews: interviews.map((i) => ({
        id: String(i._id),
        job: (i.jobId as { title?: string })?.title || "",
        scheduledAt: i.scheduledAt,
        status: i.status,
      })),
      consent: {
        shareWithCompanies: Boolean(profile?.consentShareWithCompanies),
        sharedFields: (profile?.sharedFields as string[]) || [],
        counselingOptIn: Boolean(profile?.counselingOptIn),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const updates: Record<string, unknown> = {};
    const asBool = (value: unknown) => value === true || value === "true" || value === "1";
    if (body.shareWithCompanies !== undefined) updates.consentShareWithCompanies = asBool(body.shareWithCompanies);
    if (body.counselingOptIn !== undefined) updates.counselingOptIn = asBool(body.counselingOptIn);
    if (body.sharedFields !== undefined) updates.sharedFields = cleanStringArray(body.sharedFields, 30, 60);
    if (!Object.keys(updates).length) return ok({ message: "No changes provided." });
    await JobSeekerProfile.findOneAndUpdate({ userId: auth.session.userId }, { $set: updates }, { upsert: true, setDefaultsOnInsert: true });
    return ok({ message: "Consent preferences saved." });
  } catch (error) {
    return handleError(error);
  }
}
