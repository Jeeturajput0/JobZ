import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { resolvePermissions, hasPermission, isSuperAdmin } from "@/lib/permissions";
import type { SystemRole } from "@/lib/constants";
import User from "@/models/User";

export interface Session {
  userId: string;
  role: SystemRole;
  fullName: string;
  email: string;
  companyId: string | null;
  counselingTeamId: string | null;
  roleId: string | null;
  permissions: string[];
  user: Record<string, unknown>;
}

/**
 * Loads the authenticated user AND their effective permissions from MongoDB.
 * Never trust a role/permission supplied by the client.
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  const authUser = getAuthUser(request);
  if (!authUser) return null;

  await connectDB();
  const user = await User.findById(authUser.userId).lean();
  if (!user) return null;
  if ((user as { status?: string }).status !== "active") return null;

  // A suspended company cannot act through any of its member accounts.
  if (user.companyId && (["employer", "companyMember"] as string[]).includes(String(user.role))) {
    const { default: Company } = await import("@/models/Company");
    const company = await Company.findById(user.companyId).select("status").lean();
    if (!company || company.status !== "active") return null;
  }

  // Use the current database role, not the (possibly stale) JWT role, so a
  // demotion or role change takes effect immediately.
  const dbRole = (user as { role?: SystemRole }).role || authUser.role;
  const permissions = await resolvePermissions({
    role: dbRole,
    roleId: user.roleId as unknown,
    directPermissions: user.directPermissions as string[] | undefined,
  });

  return {
    userId: String(user._id),
    role: dbRole,
    fullName: (user as { fullName?: string }).fullName || "",
    email: (user as { email?: string }).email || "",
    companyId: user.companyId ? String(user.companyId) : null,
    counselingTeamId: user.counselingTeamId ? String(user.counselingTeamId) : null,
    roleId: user.roleId ? String(user.roleId) : null,
    permissions,
    user: user as unknown as Record<string, unknown>,
  };
}

export function unauthorized(message = "Please login to access this resource.") {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbidden(message = "You don't have permission to perform this action.") {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export type SessionResult =
  | { authorized: true; session: Session }
  | { authorized: false; response: NextResponse };

export async function requireSession(request: NextRequest): Promise<SessionResult> {
  const session = await getSession(request);
  if (!session) return { authorized: false, response: unauthorized() };
  return { authorized: true, session };
}

/** Require a specific permission (or any of a list of permissions). */
export async function requirePermission(
  request: NextRequest,
  permission: string | string[],
): Promise<SessionResult> {
  const result = await requireSession(request);
  if (!result.authorized) return result;

  const keys = Array.isArray(permission) ? permission : [permission];
  const allowed = keys.some((key) => hasPermission(result.session.permissions, key));
  if (!allowed) {
    return {
      authorized: false,
      response: forbidden("You don't have permission to perform this action."),
    };
  }
  return result;
}

/** Require an authenticated job seeker. All candidate self-service APIs use this. */
export async function requireJobSeeker(request: NextRequest): Promise<SessionResult> {
  const result = await requireSession(request);
  if (!result.authorized) return result;
  if (result.session.role !== "jobSeeker") {
    return {
      authorized: false,
      response: forbidden("This resource is available to job seekers only."),
    };
  }
  return result;
}

/** Require one of the given system roles, regardless of granular permissions. */
export async function requireRole(
  request: NextRequest,
  roles: SystemRole[],
): Promise<SessionResult> {
  const result = await requireSession(request);
  if (!result.authorized) return result;
  if (!roles.includes(result.session.role)) {
    return { authorized: false, response: forbidden() };
  }
  return result;
}

/**
 * Company isolation. Super admins may cross scopes; everyone else must
 * belong to the company being accessed. NEVER trust a companyId from the
 * request body without this check.
 */
export function assertCompanyScope(session: Session, companyId?: string | null): NextResponse | null {
  if (isSuperAdmin(session.role)) return null;
  if (!["employer", "companyMember"].includes(session.role)) return forbidden();
  if (!session.companyId) return forbidden("No company is linked to your account.");
  if (companyId && String(companyId) !== session.companyId) {
    return forbidden("You cannot access another company's data.");
  }
  return null;
}

/** Counseling team isolation. */
export function assertCounselingScope(
  session: Session,
  counselingTeamId?: string | null,
): NextResponse | null {
  if (isSuperAdmin(session.role)) return null;
  if (!["counselingAdmin", "counselingMember"].includes(session.role)) return forbidden();
  if (!session.counselingTeamId) return forbidden("No counseling team is linked to your account.");
  if (counselingTeamId && String(counselingTeamId) !== session.counselingTeamId) {
    return forbidden("You cannot access another counseling team's data.");
  }
  return null;
}

/** Only the account owner (or a super admin) may access a candidate's own data. */
export function assertSelfOrAdmin(session: Session, userId: string): NextResponse | null {
  if (session.userId === userId || isSuperAdmin(session.role)) return null;
  return forbidden("You can only access your own account.");
}
