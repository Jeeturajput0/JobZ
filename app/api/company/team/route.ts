import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId } from "@/lib/api";
import { hasPermission, permissionsForScope } from "@/lib/permissions";
import { PERMISSION_KEYS, ROLE_LABELS } from "@/lib/constants";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import { publicUsername } from "@/lib/public-profile";
import User from "@/models/User";
import Role from "@/models/Role";
import CompanyMembership from "@/models/CompanyMembership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.team.view", "company.team.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;

    const members = await CompanyMembership.find({ companyId })
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
    const auth = await requirePermission(request, ["company.team.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);

    const body = await readJson(request);
    const email = cleanString(body.email, 254).toLowerCase();
    const fullName = cleanString(body.fullName, 80);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2) {
      return fail("A valid email and full name are required.", 400);
    }
    if (await User.findOne({ email })) return fail("An account with this email already exists.", 409);

    // A company admin may only grant permissions they themselves hold, and
    // only permissions that belong to the company scope.
    const permissions = permissionsForScope(cleanStringArray(body.permissions, 100, 120), "company");
    const escalation = permissions.filter(
      (p) => !PERMISSION_KEYS.includes(p) || (!hasPermission(auth.session.permissions, p)),
    );
    if (escalation.length) return fail("You cannot grant permissions you do not hold.", 403);

    let roleId = toObjectId(body.roleId);
    const roleKey = cleanString(body.roleKey, 80);
    if (!roleId && roleKey) {
      const role = await Role.findOne({ key: roleKey, scope: "company", scopeId: toObjectId(companyId) });
      if (role) roleId = role._id;
    }
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role || role.scope !== "company" || String(role.scopeId) !== companyId) {
        return fail("Invalid role for this company.", 400);
      }
      // Custom role permissions are also bounded by the admin's own grants.
      const disallowed = role.permissions.filter(
        (p) => !hasPermission(auth.session.permissions, p),
      );
      if (disallowed.length) return fail("The selected role contains permissions you cannot grant.", 403);
    }

    const temporaryPassword = cleanString(body.password, 72) || randomBytes(9).toString("base64url");
    if (temporaryPassword.length < 8) return fail("Password must be at least 8 characters.", 400);

    const user = await User.create({
      fullName,
      email,
      password: await bcrypt.hash(temporaryPassword, 12),
      phone: cleanString(body.phone, 30),
      role: "companyMember",
      companyId: toObjectId(companyId),
      roleId,
      directPermissions: permissions,
      invitedBy: auth.session.userId,
    });
    user.username = publicUsername(fullName, user._id);
    await user.save();

    const membership = await CompanyMembership.create({
      companyId: toObjectId(companyId)!,
      userId: user._id,
      roleId,
      title: cleanString(body.title, 100) || ROLE_LABELS.companyMember,
      permissions,
      assignedJobs: cleanStringArray(body.assignedJobs, 100, 24)
        .map((id) => toObjectId(id))
        .filter((v): v is NonNullable<typeof v> => Boolean(v)),
      invitedBy: auth.session.userId,
      invitedEmail: email,
    });

    await logActivity({
      session: auth.session,
      action: "company.team.member.added",
      entity: "User",
      entityId: String(user._id),
      description: `Added team member ${email}.`,
    });
    await notify({
      userId: String(user._id),
      type: "team.invitation",
      title: "You were added to a company team",
      message: `${fullName}, you have been added to a company workspace on JobZ.`,
      link: "/company/dashboard",
    });

    return created({ member: membership, user: { id: user._id, fullName, email, role: user.role }, temporaryPassword });
  } catch (error) {
    return handleError(error);
  }
}
