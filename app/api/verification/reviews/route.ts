import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import { getAccessibleCounselingCandidateIds } from "@/lib/counseling";
import VerificationRequest from "@/models/VerificationRequest";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.documents.verify", "platform.verification.manage"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("category")) query.category = sp.get("category");
    if (!sp.get("all")) query.status = { $in: ["pendingReview", "underReview", "additionalInfoRequired"] };
    if (auth.session.role !== "admin") {
      const accessible = await getAccessibleCounselingCandidateIds(auth.session);
      query.candidateId = { $in: accessible === null ? [] : accessible };
    }
    const [requests, total] = await Promise.all([
      VerificationRequest.find(query)
        .populate({ path: "candidateId", select: "fullName email" })
        .populate({ path: "documents", select: "name type mimeType size category" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      VerificationRequest.countDocuments(query),
    ]);
    return ok({ requests, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
