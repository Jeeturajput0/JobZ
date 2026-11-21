import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, requireObjectId, cleanStringArray, toObjectId } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { SYSTEM_ROLES, PERMISSION_KEYS, type SystemRole } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import User from "@/models/User";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.users.manage", "platform.users.suspend"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "user id");
    const body = await readJson(request);
    const user = await User.findById(id).select("-password");
    if (!user) return fail("User not found.", 404);

    // Never let anyone elevate themselves or create a super admin through this API.
    const isSelf = String(user._id) === auth.session.userId;
    if (isSelf && (body.role !== undefined || body.roleId !== undefined || body.directPermissions !== undefined)) {
      return fail("You cannot change your own role or permissions.", 403);
    }
    if (body.role === "admin" && !hasPermission(auth.session.permissions, "*")) {
      return fail("You cannot grant super admin access.", 403);
    }

    if (body.status !== undefined) {
      if (!["active", "inactive", "suspended"].includes(String(body.status))) return fail("Invalid status.", 400);
      user.status = String(body.status) as "active" | "inactive" | "suspended";
    }
    if (body.role !== undefined) {
      if (!SYSTEM_ROLES.includes(body.role as SystemRole)) return fail("Invalid role.", 400);
      user.role = body.role as SystemRole;
    }
    if (body.roleId !== undefined) user.roleId = toObjectId(body.roleId);
    if (body.companyId !== undefined) user.companyId = toObjectId(body.companyId);
    if (body.counselingTeamId !== undefined) user.counselingTeamId = toObjectId(body.counselingTeamId);
    if (body.directPermissions !== undefined) {
      const permissions = cleanStringArray(body.directPermissions, 200, 120);
      const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p) && p !== "*");
      if (invalid.length) return fail(`Unknown permissions: ${invalid.join(", ")}`, 400);
      if ((permissions.includes("*") || permissions.some((p) => p.startsWith("platform."))) && !hasPermission(auth.session.permissions, "*")) {
        return fail("Cannot grant platform-level or wildcard access.", 403);
      }
      user.directPermissions = permissions;
    }

    await user.save();
    await logActivity({
      session: auth.session,
      action: "user.updated",
      entity: "User",
      entityId: id,
      description: `Updated account ${user.email}.`,
      metadata: { status: user.status, role: user.role },
    });
    if (body.status) {
      await notify({
        userId: id,
        type: "account.status",
        title: "Account status updated",
        message: `Your JobZ account status is now ${user.status}.`,
      });
    }
    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}
