import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, parsePagination } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import { publicUsername } from "@/lib/public-profile";
import User from "@/models/User";
import CounselingTeam from "@/models/CounselingTeam";
import CounselingMembership from "@/models/CounselingMembership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("status")) query.status = sp.get("status");
    const search = sp.get("search")?.trim();
    if (search) query.name = { $regex: search, $options: "i" };
    const teams = await CounselingTeam.find(query)
      .populate({ path: "adminId", select: "fullName email" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await CounselingTeam.countDocuments(query);
    return ok({ teams, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const name = cleanString(body.name, 150);
    const adminEmail = cleanString(body.adminEmail, 254).toLowerCase();
    const adminPassword = cleanString(body.password, 72);
    const adminName = cleanString(body.adminName, 80) || adminEmail.split("@")[0];
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminPassword.length < 8) {
      return fail("Team name, a valid admin email and a password (8+ chars) are required.", 400);
    }
    if (await User.findOne({ email: adminEmail })) return fail("Email already registered.", 409);

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "counseling"}-${Date.now().toString(36)}`;
    const team = await CounselingTeam.create({ name, slug, adminId: auth.session.userId, description: cleanString(body.description, 2000) });

    const admin = await User.create({
      fullName: adminName,
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      phone: cleanString(body.phone, 30),
      role: "counselingAdmin",
      counselingTeamId: team._id,
      invitedBy: auth.session.userId,
    });
    admin.username = publicUsername(adminName, admin._id);
    await admin.save();
    team.adminId = admin._id;
    await team.save();

    await CounselingMembership.create({
      teamId: team._id,
      userId: admin._id,
      title: "Counseling Admin",
      invitedBy: auth.session.userId,
    });
    await logActivity({
      session: auth.session,
      action: "counselingTeam.created",
      entity: "CounselingTeam",
      entityId: String(team._id),
      description: `Created counseling team ${name}.`,
    });
    return created({ team, admin: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (error) {
    return handleError(error);
  }
}
