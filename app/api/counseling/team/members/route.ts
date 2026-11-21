import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId } from "@/lib/api";
import { hasPermission, permissionsForScope } from "@/lib/permissions";
import { PERMISSION_KEYS, ROLE_LABELS } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import { publicUsername } from "@/lib/public-profile";
import User from "@/models/User";
import Role from "@/models/Role";
import CounselingMembership from "@/models/CounselingMembership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const members = await CounselingMembership.find({ teamId: auth.session.counselingTeamId })
      .populate({ path: "userId", select: "-password" })
      .populate({ path: "roleId", select: "name key permissions" })
      .sort({ createdAt: -1 })
      .lean();
    return ok({ members });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const teamId = auth.session.counselingTeamId;
    if (!teamId) return fail("No counseling team is linked to your account.", 403);

    const body = await readJson(request);
    const email = cleanString(body.email, 254).toLowerCase();
    const fullName = cleanString(body.fullName, 80);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2) {
      return fail("A valid email and full name are required.", 400);
    }
    if (await User.findOne({ email })) return fail("An account with this email already exists.", 409);

    const requested = permissionsForScope(cleanStringArray(body.permissions, 100, 120), "counseling");
    const escalation = requested.filter(
      (p) => !PERMISSION_KEYS.includes(p) || (!hasPermission(auth.session.permissions, p)),
    );
    if (escalation.length) return fail("You cannot grant permissions you do not hold.", 403);

    let roleId = toObjectId(body.roleId);
    const roleKey = cleanString(body.roleKey, 80);
    if (!roleId && roleKey) {
      const role = await Role.findOne({ key: roleKey, scope: "counseling", scopeId: toObjectId(teamId) });
      if (role) roleId = role._id;
    }
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role || role.scope !== "counseling" || String(role.scopeId) !== teamId) return fail("Invalid role for this team.", 400);
    }

    const temporaryPassword = cleanString(body.password, 72) || randomBytes(9).toString("base64url");
    if (temporaryPassword.length < 8) return fail("Password must be at least 8 characters.", 400);

    const user = await User.create({
      fullName,
      email,
      password: await bcrypt.hash(temporaryPassword, 12),
      phone: cleanString(body.phone, 30),
      role: "counselingMember",
      counselingTeamId: toObjectId(teamId)!,
      roleId,
      directPermissions: requested,
      invitedBy: auth.session.userId,
    });
    user.username = publicUsername(fullName, user._id);
    await user.save();

    const membership = await CounselingMembership.create({
      teamId: toObjectId(teamId)!,
      userId: user._id,
      roleId,
      title: cleanString(body.title, 100) || ROLE_LABELS.counselingMember,
      permissions: requested,
      assignedCandidates: cleanStringArray(body.assignedCandidates, 200, 24)
        .map((v) => toObjectId(v))
        .filter((v): v is NonNullable<typeof v> => Boolean(v)),
      invitedBy: auth.session.userId,
      invitedEmail: email,
    });

    await logActivity({
      session: auth.session,
      action: "counseling.team.member.added",
      entity: "User",
      entityId: String(user._id),
      description: `Added counseling team member ${email}.`,
    });
    await notify({
      userId: String(user._id),
      type: "team.invitation",
      title: "You were added to a counseling team",
      message: `${fullName}, you have been added to a counseling workspace on JobZ.`,
      link: "/counseling/dashboard",
    });
    return created({ member: membership, user: { id: user._id, fullName, email, role: user.role }, temporaryPassword });
  } catch (error) {
    return handleError(error);
  }
}
