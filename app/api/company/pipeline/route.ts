import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { getCompanyJobFilter } from "@/lib/company";
import Application from "@/models/Application";
import { APPLICATION_STATUSES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.pipeline.view", "company.applications.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ stages: [], applications: [] });

    const sp = request.nextUrl.searchParams;
    const query: Record<string, unknown> = { companyId };
    if (sp.get("jobId")) query.jobId = sp.get("jobId");
    if (sp.get("assignedTo")) query.assignedTo = sp.get("assignedTo");
    const days = Number(sp.get("days")) || 0;
    if (days > 0) query.appliedAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };

    const applications = await Application.find(query)
      .populate({ path: "jobId", select: "title" })
      .populate({ path: "jobSeekerId", select: "fullName skills" })
      .populate({ path: "assignedTo", select: "fullName" })
      .sort({ appliedAt: -1 }).limit(300).lean();

    const stages = APPLICATION_STATUSES.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    }));
    return ok({ stages, applications });
  } catch (error) {
    return handleError(error);
  }
}
