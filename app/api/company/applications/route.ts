import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import { resolveCompanyId, getCompanyCandidateIds, getCompanyJobFilter } from "@/lib/company";
import { hasPermission } from "@/lib/permissions";
import Application from "@/models/Application";
import Job from "@/models/Job";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.applications.view", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ applications: [], total: 0 });

    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { companyId };
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("source")) query.source = sp.get("source");
    if (sp.get("assignedTo")) query.assignedTo = sp.get("assignedTo");
    const search = sp.get("search")?.trim();
    if (search) {
      const jobs = await Job.find({ ...(await getCompanyJobFilter(companyId)), title: { $regex: search, $options: "i" } }).select("_id").lean();
      query.jobId = { $in: jobs.map((j) => j._id) };
    }
    const skill = sp.get("skill")?.trim();
    const location = sp.get("location")?.trim();
    if (skill || location) {
      const allowedIds = await getCompanyCandidateIds(companyId);
      query.jobSeekerId = { $in: allowedIds };
    }

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate({ path: "jobId", select: "title location category" })
        .populate({ path: "jobSeekerId", select: "fullName headline location skills" })
        .populate({ path: "assignedTo", select: "fullName" })
        .sort({ appliedAt: -1 }).skip(skip).limit(limit).lean(),
      Application.countDocuments(query),
    ]);

    // Counsellor/recruiter assignment visibility is permission-gated.
    const canSeeAll = hasPermission(auth.session.permissions, "company.applications.view") && auth.session.role === "employer";
    const visible = canSeeAll
      ? applications
      : applications.filter((a) => !a.assignedTo || String(a.assignedTo._id || a.assignedTo) === auth.session.userId);

    return ok({ applications: visible, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
