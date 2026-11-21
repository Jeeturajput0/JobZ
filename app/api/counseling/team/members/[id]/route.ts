import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId, requireObjectId } from "@/lib/api";
import { hasPermission, permissionsForScope } from "@/lib/permissions";
import { PERMISSION_KEYS } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import User from "@/models/User";
import CounselingMembership from "@/models/CounselingMembership";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "member id");
    const membership = await CounselingMembership.findOne({ _id: id, teamId: auth.session.counselingTeamId });
    if (!membership) return fail("Team member not found.", 404);
    if (String(membership.userId) === auth.session.userId) return fail("You cannot modify your own membership.", 403);
    const body = await readJson(request);

    if (body.title !== undefined) membership.title = cleanString(body.title, 100);
    if (body.permissions !== undefined) {
      const permissions = permissionsForScope(cleanStringArray(body.permissions, 100, 120), "counseling");
      const escalation = permissions.filter((p) => !PERMISSION_KEYS.includes(p) || !hasPermission(auth.session.permissions, p));
      if (escalation.length) return fail("You cannot grant permissions you do not hold.", 403);
      membership.permissions = permissions;
    }
    // Keep the account's effective permissions in sync with its membership.
    await User.findByIdAndUpdate(membership.userId, {
      $set: { roleId: membership.roleId, directPermissions: membership.permissions },
    });
    if (body.assignedCandidates !== undefined) {
      membership.assignedCandidates = cleanStringArray(body.assignedCandidates, 300, 24)
        .map((v) => toObjectId(v))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
    }
    if (body.assignedHiringRequests !== undefined) {
      membership.assignedHiringRequests = cleanStringArray(body.assignedHiringRequests, 200, 24)
        .map((v) => toObjectId(v))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
    }
    if (body.status !== undefined && ["active", "inactive"].includes(String(body.status))) {
      membership.status = String(body.status) as "active" | "inactive";
      await User.findByIdAndUpdate(membership.userId, { $set: { status: membership.status === "active" ? "active" : "inactive" } });
      await notify({
        userId: String(membership.userId),
        type: "team.status",
        title: "Team account status changed",
        message: `Your counseling account is now ${membership.status}.`,
      });
    }
    await membership.save();
    await logActivity({ session: auth.session, action: "counseling.team.member.updated", entity: "CounselingMembership", entityId: id, description: "Updated counseling team member." });
    return ok({ membership });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "member id");
    const membership = await CounselingMembership.findOne({ _id: id, teamId: auth.session.counselingTeamId });
    if (!membership) return fail("Team member not found.", 404);
    if (String(membership.userId) === auth.session.userId) return fail("You cannot remove yourself.", 403);
    await User.findByIdAndUpdate(membership.userId, { $set: { status: "inactive", counselingTeamId: null, roleId: null } });
    await membership.deleteOne();
    await logActivity({ session: auth.session, action: "counseling.team.member.removed", entity: "CounselingMembership", entityId: id, description: "Removed counseling team member." });
    return ok({ message: "Team member removed." });
  } catch (error) {
    return handleError(error);
  }
}
