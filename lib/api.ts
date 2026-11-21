import { NextResponse } from "next/server";
import mongoose from "mongoose";

/** Consistent API response envelope used by every new route handler. */
export function ok<T extends Record<string, unknown>>(data: T = {} as T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function created<T extends Record<string, unknown>>(data: T) {
  return ok(data, 201);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, message, ...(extra || {}) }, { status });
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.message, error.status);
  }
  console.error("API error:", error);
  return fail("Something went wrong.", 500);
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export function toObjectId(value: unknown): mongoose.Types.ObjectId | null {
  return isObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}

export function requireObjectId(value: unknown, field = "id"): string {
  if (!isObjectId(value)) throw new ApiError(`Invalid ${field}.`, 400);
  return value;
}

export function parsePagination(params: URLSearchParams, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(params.get("limit")) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** Trim + length-limit a string field. Returns "" for non strings. */
export function cleanString(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/** Accepts a real array or a comma-separated string from simple HTML forms. */
export function commaArray(value: unknown, maxItems = 30, maxLen = 120): string[] {
  return cleanStringArray(value, maxItems, maxLen);
}

export function cleanStringArray(value: unknown, maxItems = 30, maxLen = 120): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().slice(0, maxLen))
      .filter(Boolean)
      .slice(0, maxItems);
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function requireFields(body: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw new ApiError(`${field} is required.`, 400);
    }
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError("Invalid request body.", 400);
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Invalid JSON body.", 400);
  }
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(`Invalid ${field}.`, 400);
  }
  return value as T;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
