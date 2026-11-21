import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, oneOf } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { PERMISSION_KEYS, PERMISSION_CATALOG } from "@/lib/constants";
import { parsePagination } from "@/lib/api";
import Role from "@/models/Role";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.roles.view"]);
    if (!auth.authorized) return auth.response;
    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams, 50);
    const scope = request.nextUrl.searchParams.get("scope");
    const query = (scope ? { scope } : {}) as Record<string, unknown>;
    const [roles, total] = await Promise.all([
      Role.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Role.countDocuments(query),
    ]);
    return ok({ roles, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.roles.manage"]);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const name = cleanString(body.name, 80);
    const key = cleanString(body.key, 80).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!name || !key) return fail("Name and key are required.", 400);

    const scope = oneOf(body.scope, ["platform", "company", "counseling"] as const, "scope");
    const permissions = cleanStringArray(body.permissions, 200, 120);
    const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p));
    if (invalid.length) return fail(`Unknown permissions: ${invalid.join(", ")}`, 400);
    const escalation = permissions.filter(
      (p) => PERMISSION_CATALOG.find((d) => d.key === p)?.sensitive && !hasPermission(auth.session.permissions, "platform.roles.manage"),
    );
    if (escalation.length) return fail("You cannot grant sensitive permissions.", 403);

    const role = await Role.create({
      name,
      key,
      description: cleanString(body.description, 500),
      scope,
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
