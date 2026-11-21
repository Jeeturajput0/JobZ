import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId, requireObjectId } from "@/lib/api";
import { hasPermission, permissionsForScope } from "@/lib/permissions";
import { PERMISSION_KEYS } from "@/lib/constants";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import User from "@/models/User";
import Role from "@/models/Role";
import CompanyMembership from "@/models/CompanyMembership";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.team.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "member id");
    const membership = await CompanyMembership.findOne({ _id: id, companyId });
    if (!membership) return fail("Team member not found.", 404);
    if (String(membership.userId) === auth.session.userId) return fail("You cannot modify your own membership.", 403);

    const body = await readJson(request);
    if (body.title !== undefined) membership.title = cleanString(body.title, 100);
    if (body.permissions !== undefined) {
      const permissions = permissionsForScope(cleanStringArray(body.permissions, 100, 120), "company");
      const escalation = permissions.filter(
        (p) => !PERMISSION_KEYS.includes(p) || (!hasPermission(auth.session.permissions, p) && !hasPermission(auth.session.permissions, "company.roles.manage")),
      );
      if (escalation.length) return fail("You cannot grant permissions you do not hold.", 403);
      membership.permissions = permissions;
    }
    if (body.roleId !== undefined) {
      const roleId = toObjectId(body.roleId);
      if (roleId) {
        const role = await Role.findById(roleId);
        if (!role || role.scope !== "company" || String(role.scopeId) !== String(companyId)) {
          return fail("Invalid role for this company.", 400);
        }
      }
      membership.roleId = roleId;
    }
    // Keep the account's effective permissions in sync with its membership.
    await User.findByIdAndUpdate(membership.userId, {
      $set: { roleId: membership.roleId, directPermissions: membership.permissions },
    });
    if (body.assignedJobs !== undefined) {
      membership.assignedJobs = cleanStringArray(body.assignedJobs, 100, 24)
        .map((v) => toObjectId(v))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
    }
    if (body.assignedCandidates !== undefined) {
      membership.assignedCandidates = cleanStringArray(body.assignedCandidates, 200, 24)
        .map((v) => toObjectId(v))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
    }
    if (body.status !== undefined && ["active", "inactive"].includes(String(body.status))) {
      membership.status = String(body.status) as "active" | "inactive";
      await User.findByIdAndUpdate(membership.userId, {
        $set: { status: membership.status === "active" ? "active" : "inactive" },
      });
      await notify({
        userId: String(membership.userId),
        type: "team.status",
        title: "Team account status changed",
        message: `Your company account is now ${membership.status}.`,
      });
    }
    await membership.save();
    await logActivity({
      session: auth.session,
      action: "company.team.member.updated",
      entity: "CompanyMembership",
      entityId: id,
      description: "Updated a company team member.",
    });
    return ok({ membership });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.team.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "member id");
    const membership = await CompanyMembership.findOne({ _id: id, companyId });
    if (!membership) return fail("Team member not found.", 404);
    if (String(membership.userId) === auth.session.userId) return fail("You cannot remove yourself.", 403);

    await User.findByIdAndUpdate(membership.userId, {
      $set: { status: "inactive", companyId: null, roleId: null },
    });
    await membership.deleteOne();
    await logActivity({
      session: auth.session,
      action: "company.team.member.removed",
      entity: "CompanyMembership",
      entityId: id,
      description: "Removed a company team member.",
    });
    return ok({ message: "Team member removed from the company." });
  } catch (error) {
    return handleError(error);
  }
}
