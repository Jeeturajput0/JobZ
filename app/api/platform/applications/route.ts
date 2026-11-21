import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.users.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("source")) query.source = sp.get("source");
    const search = sp.get("search")?.trim();
    if (search) {
      const [jobs, users] = await Promise.all([
        Job.find({ title: { $regex: search, $options: "i" } }).select("_id").lean(),
        User.find({ fullName: { $regex: search, $options: "i" } }).select("_id").lean(),
      ]);
      query.$or = [
        { jobId: { $in: jobs.map((j) => j._id) } },
        { jobSeekerId: { $in: users.map((u) => u._id) } },
      ];
    }
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate({ path: "jobId", select: "title status approvalStatus" })
        .populate({ path: "jobSeekerId", select: "fullName email" })
        .populate({ path: "employerId", select: "fullName" })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "recommendationId", select: "status counselorId" })
        .sort({ appliedAt: -1 }).skip(skip).limit(limit).lean(),
      Application.countDocuments(query),
    ]);
    return ok({ applications, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
