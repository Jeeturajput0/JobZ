import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Placement from "@/models/Placement";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.analytics.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("source")) query.source = sp.get("source");
    if (sp.get("companyId")) query.companyId = sp.get("companyId");
    if (sp.get("counselingTeamId")) query.counselingTeamId = sp.get("counselingTeamId");
    const search = sp.get("search")?.trim();
    if (search) query.notes = { $regex: search, $options: "i" };

    const [placements, total] = await Promise.all([
      Placement.find(query)
        .populate({ path: "candidateId", select: "fullName email" })
        .populate({ path: "jobId", select: "title" })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "counselingTeamId", select: "name" })
        .populate({ path: "counselorId", select: "fullName" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Placement.countDocuments(query),
    ]);
    return ok({ placements, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
