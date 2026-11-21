import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, requireObjectId, toObjectId } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import Job from "@/models/Job";
import EmployerProfile from "@/models/EmployerProfile";
import Application from "@/models/Application";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.jobs.approve"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "job id");
    const job = await Job.findById(id)
      .populate({ path: "employerId", select: "fullName email" })
      .populate({ path: "companyId", model: EmployerProfile, select: "companyName industry location" })
      .lean();
    if (!job) return fail("Job not found.", 404);
    const applications = await Application.find({ jobId: id })
      .populate({ path: "jobSeekerId", select: "fullName" })
      .sort({ appliedAt: -1 }).limit(50).lean();
    return ok({ job, applications });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.jobs.approve"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "job id");
    const job = await Job.findById(id);
    if (!job) return fail("Job not found.", 404);
    const body = await readJson(request);
    let changed = false;

    if (body.approvalStatus !== undefined) {
      const status = String(body.approvalStatus);
      if (!["pending", "approved", "rejected"].includes(status)) return fail("Invalid approval status.", 400);
      job.approvalStatus = status as "pending" | "approved" | "rejected";
      job.reviewedBy = toObjectId(auth.session.userId) || undefined;
      job.reviewedAt = new Date();
      changed = true;
    }
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!["draft", "active", "inactive", "closed"].includes(status)) return fail("Invalid job status.", 400);
      job.status = status as "draft" | "active" | "inactive" | "closed";
      changed = true;
    }
    if (!changed) return fail("No supported field provided.", 400);
    await job.save();

    await logActivity({
      session: auth.session,
      action: body.approvalStatus ? `job.${body.approvalStatus}` : "job.status.updated",
      entity: "Job",
      entityId: id,
      description: `Job "${job.title}" ${body.approvalStatus ? `approval set to ${body.approvalStatus}` : `status set to ${job.status}`}.`,
      metadata: { reason: typeof body.reason === "string" ? body.reason.slice(0, 500) : "" },
    });
    if (body.approvalStatus) {
      await notify({
        userId: String(job.employerId),
        type: "job.approval",
        title: "Job review updated",
        message: `Your job "${job.title}" was ${body.approvalStatus}.`,
        link: "/employer/manage-jobs",
      });
    }
    return ok({ job });
  } catch (error) {
    return handleError(error);
  }
}
