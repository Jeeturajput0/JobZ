import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanStringArray, toObjectId } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { PERMISSION_KEYS } from "@/lib/constants";
import { logActivity } from "@/lib/notify";
import User from "@/models/User";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.users.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectIdSafe((await ctx.params).id);
    if (!id) return fail("Invalid admin id.", 400);
    const admin = await User.findOne({ _id: new mongoose.Types.ObjectId(id), role: "admin" });
    if (!admin) return fail("Super admin not found.", 404);

    const body = await readJson(request);
    if (id === auth.session.userId && body.status !== undefined && String(body.status) !== "active") {
      return fail("You cannot deactivate or suspend your own account.", 403);
    }
    if (body.status !== undefined && ["active", "inactive", "suspended"].includes(String(body.status))) {
      admin.status = String(body.status) as "active" | "inactive" | "suspended";
    }
    if (body.roleId !== undefined) {
      admin.roleId = toObjectId(body.roleId);
    }
    if (body.directPermissions !== undefined) {
      const permissions = cleanStringArray(body.directPermissions, 200, 120);
      const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p) && p !== "*");
      if (invalid.length) return fail(`Unknown permissions: ${invalid.join(", ")}`, 400);
      if (permissions.includes("*") && !hasPermission(auth.session.permissions, "*")) {
        return fail("You cannot grant wildcard access.", 403);
      }
      admin.directPermissions = permissions;
    }
    await admin.save();
    await logActivity({ session: auth.session, action: "admin.updated", entity: "User", entityId: id, description: `Updated super admin ${admin.email}.` });
    return ok({ admin });
  } catch (error) {
    return handleError(error);
  }
}

function requireObjectIdSafe(value: string): string | null {
  return /^[a-f\d]{24}$/i.test(value) ? value : null;
}
