import Role from "@/models/Role";
import {
  SYSTEM_ROLE_PERMISSIONS,
  type SystemRole,
} from "@/lib/constants";

/** Supports `"*"`, exact keys and prefix wildcards such as `company.*`. */
export function hasPermission(permissions: string[], key: string): boolean {
  if (permissions.includes("*")) return true;
  if (permissions.includes(key)) return true;
  return permissions.some(
    (grant) => grant.endsWith(".*") && key.startsWith(grant.slice(0, -1)),
  );
}

export function hasAnyPermission(permissions: string[], keys: string[]): boolean {
  return keys.some((key) => hasPermission(permissions, key));
}

interface PermissionSourceUser {
  role: SystemRole;
  roleId?: unknown;
  directPermissions?: string[];
}

/**
 * Permissions are always resolved from the database on every request — the
 * JWT only carries identity. This means a revoked role or permission takes
 * effect immediately and cannot be bypassed by a stale token.
 */
export async function resolvePermissions(user: PermissionSourceUser): Promise<string[]> {
  let base: string[] = [];

  if (user.roleId) {
    const customRole = await Role.findById(user.roleId)
      .select("permissions status")
      .lean();
    if (customRole && (customRole as { status?: string }).status === "active") {
      base = Array.isArray((customRole as { permissions?: string[] }).permissions)
        ? [...((customRole as { permissions: string[] }).permissions)]
        : [];
    }
  }

  // A custom role defines the exact baseline. Without one, the system role
  // defaults apply. Direct grants are always additive on top of the baseline.
  if (!user.roleId) {
    base = [...(SYSTEM_ROLE_PERMISSIONS[user.role] || [])];
  }

  if (Array.isArray(user.directPermissions)) {
    base.push(...user.directPermissions.filter((p) => typeof p === "string"));
  }

  return Array.from(new Set(base));
}

export function isSuperAdmin(role: SystemRole): boolean {
  return role === "admin";
}

/** Only keys belonging to the given scope may be granted inside that scope. */
export function permissionsForScope(keys: string[], scope: "company" | "counseling"): string[] {
  const prefix = `${scope}.`;
  return Array.from(new Set(keys.filter((key) => key.startsWith(prefix))));
}
