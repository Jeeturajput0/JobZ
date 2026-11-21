import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { resolveCompanyId, getCompanyJobFilter } from "@/lib/company";
import Job from "@/models/Job";
import EmployerProfile from "@/models/EmployerProfile";
import Application from "@/models/Application";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.jobs.view", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "job id");
    const job = await Job.findOne({ _id: id, ...(await getCompanyJobFilter(companyId || "")) })
      .populate({ path: "companyId", model: EmployerProfile, select: "companyName companyLogo" })
      .lean();
    if (!job) return fail("Job not found for your company.", 404);
    const applications = await Application.find({ jobId: id })
      .populate({ path: "jobSeekerId", select: "fullName" })
      .sort({ appliedAt: -1 }).limit(50).lean();
    return ok({ job, applications });
  } catch (error) {
    return handleError(error);
  }
}
