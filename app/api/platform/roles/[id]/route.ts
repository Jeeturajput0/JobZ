import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, cleanStringArray, requireObjectId } from "@/lib/api";
import { PERMISSION_KEYS } from "@/lib/constants";
import Role from "@/models/Role";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.roles.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "role id");
    const body = await readJson(request);
    const role = await Role.findById(id);
    if (!role) return fail("Role not found.", 404);

    if (body.name !== undefined) role.name = cleanString(body.name, 80) || role.name;
    if (body.description !== undefined) role.description = cleanString(body.description, 500);
    if (body.status !== undefined) {
      if (!["active", "inactive"].includes(String(body.status))) return fail("Invalid status.", 400);
      role.status = String(body.status) as "active" | "inactive";
    }
    if (body.permissions !== undefined) {
      const permissions = cleanStringArray(body.permissions, 200, 120);
      const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p));
      if (invalid.length) return fail(`Unknown permissions: ${invalid.join(", ")}`, 400);
      role.permissions = permissions;
    }
    await role.save();
    return ok({ role });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.roles.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "role id");
    const role = await Role.findById(id);
    if (!role) return fail("Role not found.", 404);
    if (role.isSystem) return fail("System roles cannot be deleted.", 403);
    await role.deleteOne();
    return ok({ message: "Role deleted." });
  } catch (error) {
    return handleError(error);
  }
}
