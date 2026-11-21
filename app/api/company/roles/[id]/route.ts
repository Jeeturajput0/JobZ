import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, cleanStringArray, requireObjectId } from "@/lib/api";
import { hasPermission, permissionsForScope } from "@/lib/permissions";
import { PERMISSION_KEYS } from "@/lib/constants";
import { resolveCompanyId } from "@/lib/company";
import Role from "@/models/Role";
import User from "@/models/User";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.roles.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "role id");
    const role = await Role.findOne({ _id: id, scope: "company", scopeId: companyId });
    if (!role) return fail("Role not found.", 404);
    const body = await readJson(request);

    if (body.name !== undefined) role.name = cleanString(body.name, 80) || role.name;
    if (body.description !== undefined) role.description = cleanString(body.description, 500);
    if (body.permissions !== undefined) {
      const permissions = permissionsForScope(cleanStringArray(body.permissions, 100, 120), "company");
      const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p));
      if (invalid.length) return fail(`Unknown permissions: ${invalid.join(", ")}`, 400);
      const escalation = permissions.filter((p) => !hasPermission(auth.session.permissions, p));
      if (escalation.length) return fail("You cannot grant permissions you do not hold.", 403);
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
    const auth = await requirePermission(request, ["company.roles.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "role id");
    const inUse = await User.countDocuments({ roleId: id });
    if (inUse) return fail("This role is assigned to users and cannot be deleted.", 409);
    await Role.deleteOne({ _id: id, scope: "company", scopeId: companyId });
    return ok({ message: "Role deleted." });
  } catch (error) {
    return handleError(error);
  }
}
