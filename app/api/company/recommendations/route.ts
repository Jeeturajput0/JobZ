import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import CandidateRecommendation from "@/models/CandidateRecommendation";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.hiringRequests.manage", "company.candidates.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { companyId };
    if (sp.get("status")) query.status = sp.get("status");
    const [recommendations, total] = await Promise.all([
      CandidateRecommendation.find(query)
        .populate({ path: "candidateId", select: "fullName email" })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "hiringRequestId", select: "jobTitle" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CandidateRecommendation.countDocuments(query),
    ]);
    return ok({ recommendations, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
