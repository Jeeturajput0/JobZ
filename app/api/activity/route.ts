import { NextRequest } from "next/server";
import { requireSession } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import ActivityLog from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.authorized) return auth.response;
    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams, 20);
    const [logs, total] = await Promise.all([
      ActivityLog.find({ actorId: auth.session.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments({ actorId: auth.session.userId }),
    ]);
    return ok({ logs, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
