import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, parsePagination, toObjectId } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/notify";
import { publicUsername } from "@/lib/public-profile";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.users.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { role: "admin" };
    const search = sp.get("search")?.trim();
    if (search) query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
    const [admins, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return ok({ admins, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.roles.manage"]);
    if (!auth.authorized) return auth.response;
    if (!hasPermission(auth.session.permissions, "*") && !hasPermission(auth.session.permissions, "platform.users.manage")) {
      return fail("You cannot create platform administrators.", 403);
    }
    const body = await readJson(request);
    const fullName = cleanString(body.fullName, 80);
    const email = cleanString(body.email, 254).toLowerCase();
    const password = cleanString(body.password, 72);
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return fail("Name, a valid email and a password (8+ chars) are required.", 400);
    }
    if (await User.findOne({ email })) return fail("Email already registered.", 409);
    const admin = await User.create({
      fullName, email, password: await bcrypt.hash(password, 12),
      role: "admin", status: "active", invitedBy: auth.session.userId,
    });
    admin.username = publicUsername(fullName, admin._id);
    await admin.save();
    await logActivity({ session: auth.session, action: "admin.created", entity: "User", entityId: String(admin._id), description: `Created super admin ${email}.` });
    return created({ admin: { id: admin._id, fullName, email, role: admin.role } });
  } catch (error) {
    return handleError(error);
  }
}
