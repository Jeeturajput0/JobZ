import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import CompanyMembership from "@/models/CompanyMembership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.users.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("companyId")) query.companyId = sp.get("companyId");
    if (sp.get("status")) query.status = sp.get("status");
    const [members, total] = await Promise.all([
      CompanyMembership.find(query)
        .populate({ path: "userId", select: "fullName email status" })
        .populate({ path: "companyId", select: "name" })
        .populate({ path: "roleId", select: "name key" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CompanyMembership.countDocuments(query),
    ]);
    return ok({ members, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
