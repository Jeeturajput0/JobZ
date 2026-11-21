
import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SYSTEM_ROLES, type SystemRole } from "@/lib/constants";

export interface AuthUser {
  userId: string;
  role: SystemRole;
}

export function getAuthUser(
  request: NextRequest
): AuthUser | null {
  return getAuthUserFromToken(request.cookies.get("jobz_token")?.value);
}

export function getAuthUserFromToken(token?: string): AuthUser | null {
  try {
    if (!token) {
      return null;
    }

    // 2. Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // 3. Verify token
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload;

    // 4. Validate token data
    if (
      typeof payload.userId !== "string" ||
      !SYSTEM_ROLES.includes(payload.role)
    ) {
      return null;
    }

    // 5. Return authenticated user information
    return {
      userId: payload.userId,
      role: payload.role as SystemRole,
    };
  } catch {
    return null;
  }
}
