
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, AuthUser } from "@/lib/auth";

type UserRole = AuthUser["role"];

type AuthorizationResult =
  | { authorized: true; user: AuthUser }
  | { authorized: false; response: NextResponse };

export function authorize(
  request: NextRequest,
  allowedRoles: UserRole[]
): AuthorizationResult {
  // 1. Verify user authentication
  const user = getAuthUser(request);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Please login to access this resource.",
        },
        { status: 401 }
      ),
    };
  }

  // 2. Check user role
  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "You don't have permission to access this resource.",
        },
        { status: 403 }
      ),
    };
  }

  // 3. Return authorized user
  return {
    authorized: true,
    user,
  };
}
