
import { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthUser {
  userId: string;
  role: "jobSeeker" | "employer" | "admin";
}

export function getAuthUser(
  request: NextRequest
): AuthUser | null {
  try {
    // 1. Get JWT token from cookie
    const token = request.cookies.get("jobz_token")?.value;

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
      !["jobSeeker", "employer", "admin"].includes(payload.role)
    ) {
      return null;
    }

    // 5. Return authenticated user information
    return {
      userId: payload.userId,
      role: payload.role as AuthUser["role"],
    };
  } catch {
    return null;
  }
}
