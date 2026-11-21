import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Interview from "@/models/Interview";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { candidateId: new mongoose.Types.ObjectId(auth.session.userId) };
    const period = sp.get("period");
    if (period === "upcoming") {
      query.scheduledAt = { $gte: new Date() };
      query.status = "scheduled";
    } else if (period === "past") {
      query.scheduledAt = { $lt: new Date() };
    }
    if (sp.get("status")) query.status = sp.get("status");

    const [interviews, total] = await Promise.all([
      Interview.find(query)
        .populate({ path: "jobId", select: "title location" })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "interviewerIds", select: "fullName" })
        .sort({ scheduledAt: period === "past" ? -1 : 1 })
        .skip(skip).limit(limit).lean(),
      Interview.countDocuments(query),
    ]);
    return ok({ interviews, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
