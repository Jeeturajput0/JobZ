
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, AuthUser } from "@/lib/auth";
import type { SystemRole } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

type UserRole = SystemRole;

type AuthorizationResult =
  | { authorized: true; user: AuthUser }
  | { authorized: false; response: NextResponse };

/**
 * Role gate for legacy route handlers. The JWT only carries identity;
 * account status and the current role are always re-read from MongoDB so a
 * suspended account or revoked role cannot keep using an old token.
 */
export async function authorize(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<AuthorizationResult> {
  const user = getAuthUser(request);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Please login to access this resource." },
        { status: 401 }
      ),
    };
  }

  try {
    await connectDB();
    const dbUser = await User.findById(user.userId).select("status role").lean();
    if (!dbUser || dbUser.status !== "active") {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: "Your account is not active." },
          { status: 403 }
        ),
      };
    }
    const currentRole = dbUser.role as SystemRole;
    if (!allowedRoles.includes(currentRole)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, message: "You don't have permission to access this resource." },
          { status: 403 }
        ),
      };
    }
    return { authorized: true, user: { ...user, role: currentRole } };
  } catch (error) {
    console.error("Authorization error:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      ),
    };
  }
}
