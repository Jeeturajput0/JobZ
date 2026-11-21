import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Notification from "@/models/Notification";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.authorized) return auth.response;
    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams, 20);
    const [notifications, total, unread] = await Promise.all([
      Notification.find({ userId: auth.session.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId: auth.session.userId }),
      Notification.countDocuments({ userId: auth.session.userId, read: false }),
    ]);
    return ok({ notifications, total, unread, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.authorized) return auth.response;
    await Notification.updateMany({ userId: auth.session.userId, read: false }, { $set: { read: true, readAt: new Date() } });
    return ok({ message: "All notifications marked as read." });
  } catch (error) {
    return handleError(error);
  }
}
