import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import ActivityLog from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.activity.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 30);
    const query: Record<string, unknown> = {};
    if (sp.get("action")) query.action = sp.get("action");
    if (sp.get("companyId")) query.companyId = sp.get("companyId");
    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(query),
    ]);
    return ok({ logs, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
