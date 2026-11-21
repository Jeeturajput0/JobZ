import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, parsePagination, isObjectId, toObjectId } from "@/lib/api";
import { resolveCompanyId, getCompanyJobFilter } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Interview from "@/models/Interview";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.jobs.view", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ jobs: [], total: 0 });

    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = await getCompanyJobFilter(companyId);
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("approvalStatus")) query.approvalStatus = sp.get("approvalStatus");
    if (sp.get("category")) query.category = { $regex: sp.get("category"), $options: "i" };
    const search = sp.get("search")?.trim();
    if (search) query.title = { $regex: search, $options: "i" };

    const sort: Record<string, 1 | -1> = sp.get("sort") === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const [jobs, total] = await Promise.all([
      Job.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Job.countDocuments(query),
    ]);
    const ids = jobs.map((j) => j._id);
    const [applications, interviews] = await Promise.all([
      Application.aggregate([
        { $match: { jobId: { $in: ids } } },
        { $group: { _id: "$jobId", total: { $sum: 1 }, shortlisted: { $sum: { $cond: [{ $in: ["$status", ["shortlisted", "selected"]] }, 1, 0] } }, selected: { $sum: { $cond: [{ $in: ["$status", ["selected", "hired"]] }, 1, 0] } } } },
      ]),
      Interview.aggregate([{ $match: { jobId: { $in: ids } } }, { $group: { _id: "$jobId", count: { $sum: 1 } } }]),
    ]);
    const appMap = new Map(applications.map((a) => [String(a._id), a]));
    const intMap = new Map(interviews.map((i) => [String(i._id), i.count]));
    return ok({
      jobs: jobs.map((j) => ({
        ...j,
        applications: (appMap.get(String(j._id)) as { total?: number } | undefined)?.total || 0,
        shortlisted: (appMap.get(String(j._id)) as { shortlisted?: number } | undefined)?.shortlisted || 0,
        selected: (appMap.get(String(j._id)) as { selected?: number } | undefined)?.selected || 0,
        interviews: intMap.get(String(j._id)) || 0,
      })),
      total, page, limit,
    });
  } catch (error) {
    return handleError(error);
  }
}

/** Duplicate an existing job into a draft, keeping approval workflow intact. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.jobs.create"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);
    const body = await readJson(request);
    if (!isObjectId(body.jobId)) return fail("A valid job is required.", 400);
    const source = await Job.findOne({ _id: body.jobId, ...(await getCompanyJobFilter(companyId)) });
    if (!source) return fail("Job not found for your company.", 404);

    const data = source.toObject() as unknown as Record<string, unknown>;
    delete data._id;
    delete data.__v;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.reviewedBy;
    delete data.reviewedAt;
    data.slug = `${String(data.slug || "job").replace(/-\d+$/, "")}-copy-${Date.now().toString(36)}`;
    data.title = `${String(data.title || "Job")} (Copy)`;
    data.status = "draft";
    data.approvalStatus = "pending";
    data.employerId = toObjectId(auth.session.userId);
    data.companyId = toObjectId(companyId);
    const job = await Job.create(data);
    await logActivity({ session: auth.session, action: "job.duplicated", entity: "Job", entityId: String(job._id), description: `Duplicated job ${source.title}.` });
    return created({ job });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.jobs.edit"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const body = await readJson(request);
    if (!isObjectId(body.jobId)) return fail("A valid job is required.", 400);
    const job = await Job.findOne({ _id: body.jobId, ...(await getCompanyJobFilter(companyId || "")) });
    if (!job) return fail("Job not found for your company.", 404);

    const allowed = ["draft", "active", "inactive", "closed"];
    if (body.status !== undefined) {
      if (!allowed.includes(String(body.status))) return fail("Invalid job status.", 400);
      if (String(body.status) === "active" && job.approvalStatus !== "approved") {
        return fail("Only approved jobs can be activated. Submit for approval first.", 409);
      }
      job.status = String(body.status) as typeof job.status;
    }
    // Companies may submit a pending job for approval but can never approve it.
    if (body.approvalStatus !== undefined) {
      if (String(body.approvalStatus) !== "pending") return fail("Companies can only submit jobs for approval.", 403);
      job.approvalStatus = "pending";
    }
    if (body.applicationDeadline !== undefined) {
      const deadline = body.applicationDeadline ? new Date(String(body.applicationDeadline)) : null;
      if (deadline && Number.isNaN(deadline.getTime())) return fail("Invalid deadline.", 400);
      job.applicationDeadline = deadline || undefined;
    }
    await job.save();
    await logActivity({ session: auth.session, action: "job.status.updated", entity: "Job", entityId: String(job._id), description: `Job ${job.title} status set to ${job.status}.` });
    if (body.status === "active") {
      await notify({ userId: auth.session.userId, type: "job.activated", title: "Job activated", message: `${job.title} is now active.`, link: "/company/jobs" });
    }
    return ok({ job });
  } catch (error) {
    return handleError(error);
  }
}
