import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import CandidateRecommendation from "@/models/CandidateRecommendation";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { candidateId: auth.session.userId };
    if (sp.get("status")) query.status = sp.get("status");
    const [recommendations, total] = await Promise.all([
      CandidateRecommendation.find(query)
        .populate({ path: "jobId", select: "title companyId location jobType workMode skills minSalary maxSalary" })
        .populate({ path: "companyId", select: "name logo industry" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CandidateRecommendation.countDocuments(query),
    ]);
    return ok({ recommendations, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
