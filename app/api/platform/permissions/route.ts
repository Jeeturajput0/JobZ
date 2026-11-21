import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError } from "@/lib/api";
import { PERMISSION_CATALOG, PERMISSION_GROUPS_DERIVED } from "@/lib/constants";
import Permission from "@/models/Permission";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.permissions.view", "platform.roles.view"]);
    if (!auth.authorized) return auth.response;

    let stored: Record<string, unknown>[] = [];
    try {
      stored = (await Permission.find({}).lean()) as unknown as Record<string, unknown>[];
    } catch {
      stored = [];
    }
    const storedByKey = new Map(stored.map((p) => [String(p.key), p]));

    const permissions = PERMISSION_CATALOG.map((p) => ({
      ...p,
      ...(storedByKey.get(p.key) || {}),
      key: p.key,
      label: p.label,
      group: p.group,
      scopes: p.scopes,
      sensitive: p.sensitive || false,
    }));

    return ok({ permissions, groups: PERMISSION_GROUPS_DERIVED });
  } catch (error) {
    return handleError(error);
  }
}
