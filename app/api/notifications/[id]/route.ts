import { NextRequest } from "next/server";
import { requireSession } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import Notification from "@/models/Notification";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireSession(request);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "notification id");
    const notification = await Notification.findOne({ _id: id, userId: auth.session.userId });
    if (!notification) return fail("Notification not found.", 404);
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    return ok({ notification });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireSession(request);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "notification id");
    await Notification.deleteOne({ _id: id, userId: auth.session.userId });
    return ok({ message: "Notification removed." });
  } catch (error) {
    return handleError(error);
  }
}
