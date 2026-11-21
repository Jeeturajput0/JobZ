import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { resolveCompanyId, getCompanyJobFilter } from "@/lib/company";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Interview from "@/models/Interview";
import HiringRequest from "@/models/HiringRequest";
import CompanyMembership from "@/models/CompanyMembership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.analytics.view", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;

    const jobQuery: Record<string, unknown> = await getCompanyJobFilter(companyId || "");
    const appQuery: Record<string, unknown> = { companyId: companyId || "" };

    const [totalJobs, activeJobs, totalApplications, shortlisted, interviews, hires, hiringRequests, teamMembers] = await Promise.all([
      Job.countDocuments(jobQuery),
      Job.countDocuments({ ...jobQuery, status: "active" }),
      Application.countDocuments(appQuery),
      Application.countDocuments({ ...appQuery, status: { $in: ["shortlisted", "interviewScheduled", "selected"] } }),
      Interview.countDocuments({ companyId: companyId || "" }),
      Application.countDocuments({ ...appQuery, status: "hired" }),
      HiringRequest.countDocuments({ companyId: companyId || "", status: { $nin: ["completed", "cancelled"] } }),
      CompanyMembership.countDocuments({ companyId: companyId || "", status: "active" }),
    ]);

    const applicationsByStatus = await Application.aggregate([
      { $match: appQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);
    const jobsByPerformance = await Job.aggregate([
      { $match: jobQuery },
      { $lookup: { from: "applications", localField: "_id", foreignField: "jobId", as: "applications" } },
      { $project: { title: 1, applications: { $size: "$applications" }, status: 1 } },
      { $sort: { applications: -1 } },
      { $limit: 10 },
    ]);
    return ok({ analytics: { totalJobs, activeJobs, totalApplications, shortlisted, interviews, hires, hiringRequests, teamMembers, applicationsByStatus, jobsByPerformance } });
  } catch (error) {
    return handleError(error);
  }
}
