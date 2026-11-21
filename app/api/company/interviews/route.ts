import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, toObjectId, isObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import Job from "@/models/Job";
import Interview from "@/models/Interview";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.interviews.manage", "company.applications.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const interviews = await Interview.find({ companyId })
      .populate({ path: "candidateId", select: "fullName email" })
      .populate({ path: "jobId", select: "title" })
      .sort({ scheduledAt: -1 })
      .lean();
    return ok({ interviews });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.interviews.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);

    const body = await readJson(request);
    const applicationId = isObjectId(body.applicationId) ? body.applicationId : null;
    const recommendationId = isObjectId(body.recommendationId) ? body.recommendationId : null;
    let application = null;
    if (applicationId) {
      application = await Application.findOne({ _id: applicationId, companyId });
      if (!application) return fail("Application not found for your company.", 404);
    }
    const jobId = application ? String(application.jobId) : cleanString(body.jobId, 24);
    const candidateId = application ? String(application.jobSeekerId) : cleanString(body.candidateId, 24);
    if (!isObjectId(jobId) || !isObjectId(candidateId)) return fail("Valid job and candidate are required.", 400);

    const job = await Job.findById(jobId);
    if (!job) return fail("Job not found.", 404);
    if (String(job.employerId) !== auth.session.userId && String(job.companyId) !== companyId) {
      return fail("You cannot schedule interviews for this job.", 403);
    }

    const scheduledAt = new Date(String(body.scheduledAt));
    if (Number.isNaN(scheduledAt.getTime())) return fail("A valid interview date is required.", 400);

    const interview = await Interview.create({
      applicationId: applicationId ? toObjectId(applicationId) : null,
      recommendationId: recommendationId ? toObjectId(recommendationId) : null,
      jobId: toObjectId(jobId)!,
      candidateId: toObjectId(candidateId)!,
      companyId: toObjectId(companyId)!,
      scheduledBy: toObjectId(auth.session.userId)!,
      interviewerIds: (Array.isArray(body.interviewerIds) ? body.interviewerIds : [])
        .filter((v): v is string => typeof v === "string" && isObjectId(v))
        .map((v) => toObjectId(v)!),
      scheduledAt,
      durationMinutes: Number(body.durationMinutes) || 45,
      mode: (["onsite", "remote", "phone"].includes(String(body.mode)) ? String(body.mode) : "remote") as "onsite" | "remote" | "phone",
      location: cleanString(body.location, 300),
      meetingLink: cleanString(body.meetingLink, 500),
      notes: cleanString(body.notes, 3000),
    });

    if (application) {
      application.status = "interviewScheduled";
      application.interviewDate = scheduledAt;
      application.timeline.push({ status: "interviewScheduled", note: "Interview scheduled", by: toObjectId(auth.session.userId)!, at: new Date() });
      await application.save();
    }

    await logActivity({
      session: auth.session,
      action: "interview.scheduled",
      entity: "Interview",
      entityId: String(interview._id),
      description: `Scheduled interview for ${job.title}.`,
    });
    await notify({
      userId: [candidateId],
      type: "interview.scheduled",
      title: "Interview scheduled",
      message: `An interview for ${job.title} has been scheduled.`,
      link: "/profile/applications",
    });
    return created({ interview });
  } catch (error) {
    return handleError(error);
  }
}
