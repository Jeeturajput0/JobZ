import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray } from "@/lib/api";
import { hasPermission, permissionsForScope } from "@/lib/permissions";
import { PERMISSION_KEYS } from "@/lib/constants";
import Role from "@/models/Role";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const roles = await Role.find({ scope: "counseling", scopeId: auth.session.counselingTeamId }).sort({ createdAt: -1 }).lean();
    return ok({ roles });
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
    const name = cleanString(body.name, 80);
    const key = cleanString(body.key, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!name || !key) return fail("Name and key are required.", 400);
    const permissions = permissionsForScope(cleanStringArray(body.permissions, 100, 120), "counseling");
    const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p));
    if (invalid.length) return fail(`Unknown permissions: ${invalid.join(", ")}`, 400);
    const escalation = permissions.filter((p) => !hasPermission(auth.session.permissions, p));
    if (escalation.length) return fail("You cannot grant permissions you do not hold.", 403);

    const role = await Role.create({
      name,
      key,
      description: cleanString(body.description, 500),
      scope: "counseling",
      scopeId: teamId,
      permissions,
      isSystem: false,
      status: "active",
      createdBy: auth.session.userId,
    });
    return created({ role });
  } catch (error) {
    return handleError(error);
  }
}
