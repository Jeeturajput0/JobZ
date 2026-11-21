import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import HiringRequest from "@/models/HiringRequest";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.hiringRequests.view", "counseling.hiringRequests.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("priority")) query.priority = sp.get("priority");
    if (sp.get("mine") === "true") query.assignedTo = auth.session.userId;

    const [requests, total] = await Promise.all([
      HiringRequest.find(query)
        .populate({ path: "createdBy", select: "fullName email" })
        .populate({ path: "assignedTo", select: "fullName email" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      HiringRequest.countDocuments(query),
    ]);
    return ok({ requests, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
