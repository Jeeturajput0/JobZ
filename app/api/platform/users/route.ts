import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.users.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    const role = sp.get("role");
    const status = sp.get("status");
    const search = sp.get("search")?.trim();
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return ok({ users, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
