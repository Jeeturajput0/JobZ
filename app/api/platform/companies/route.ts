import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requirePermission } from "@/lib/session";
import { ok, created, fail, handleError, readJson, parsePagination, cleanString, toObjectId } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import { publicUsername } from "@/lib/public-profile";
import Company from "@/models/Company";
import EmployerProfile from "@/models/EmployerProfile";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("verificationStatus")) query.verificationStatus = sp.get("verificationStatus");
    if (sp.get("status")) query.status = sp.get("status");
    const search = sp.get("search")?.trim();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
      ];
    }
    const [companies, total] = await Promise.all([
      Company.find(query)
        .populate({ path: "ownerId", select: "fullName email phone" })
        .populate({ path: "employerProfileId", select: "location industry companyName" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Company.countDocuments(query),
    ]);
    return ok({ companies, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/** Creates a company plus its owner account (admin provisioning). */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const name = cleanString(body.name, 150);
    const email = cleanString(body.email, 254).toLowerCase();
    const password = cleanString(body.password, 72);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return fail("Company name, a valid owner email and a password (8+ chars) are required.", 400);
    }
    if (await User.findOne({ email })) return fail("An account with this email already exists.", 409);

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "company"}-${Date.now().toString(36)}`;
    const owner = await User.create({
      fullName: cleanString(body.contactPerson, 80) || name,
      email,
      password: await bcrypt.hash(password, 12),
      phone: cleanString(body.phone, 30),
      role: "employer",
      status: "active",
      isEmailVerified: false,
      invitedBy: auth.session.userId,
    });
    owner.username = publicUsername(owner.fullName, owner._id);
    await owner.save();

    const profile = await EmployerProfile.create({
      userId: owner._id,
      companyName: name,
      industry: cleanString(body.industry, 100),
      location: cleanString(body.location, 200),
      website: cleanString(body.website, 300),
      description: cleanString(body.description, 5000),
      verificationStatus: "pending",
    });
    const company = await Company.create({
      name,
      slug,
      ownerId: owner._id,
      employerProfileId: profile._id,
      verificationStatus: "pending",
      status: "active",
      industry: profile.industry,
      website: profile.website,
      description: profile.description,
      logo: "",
    });
    await User.findByIdAndUpdate(owner._id, { $set: { companyId: company._id } });

    await logActivity({
      session: auth.session,
      action: "company.created",
      entity: "Company",
      entityId: String(company._id),
      description: `Super admin created company ${name}.`,
    });
    return created({ company, owner: { id: owner._id, email: owner.email } });
  } catch (error) {
    return handleError(error);
  }
}
