import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Job from "@/models/Job";
import EmployerProfile from "@/models/EmployerProfile";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.jobs.approve"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("approvalStatus")) query.approvalStatus = sp.get("approvalStatus");
    if (sp.get("status")) query.status = sp.get("status");
    const search = sp.get("search")?.trim();
    if (search) query.title = { $regex: search, $options: "i" };

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate({ path: "employerId", select: "fullName email" })
        .populate({ path: "companyId", model: EmployerProfile, select: "companyName industry location" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(query),
    ]);
    const ids = jobs.map((j) => String(j._id));
    const counts = await Application.aggregate([
      { $match: { jobId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    return ok({ jobs: jobs.map((j) => ({ ...j, applications: countMap.get(String(j._id)) || 0 })), total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
