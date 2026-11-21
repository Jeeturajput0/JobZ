import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireSession } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const currentPassword = cleanString(body.currentPassword, 72);
    const newPassword = cleanString(body.newPassword, 72);
    if (newPassword.length < 8 || newPassword.length > 72) return fail("New password must be 8 to 72 characters.", 400);
    const user = await User.findById(auth.session.userId).select("+password");
    if (!user) return fail("Account not found.", 404);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return fail("Current password is incorrect.", 403);
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await logActivity({ session: auth.session, action: "account.password.changed", entity: "User", entityId: auth.session.userId, description: "Changed account password." });
    return ok({ message: "Password changed successfully." });
  } catch (error) {
    return handleError(error);
  }
}
