import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, clampNumber } from "@/lib/api";
import { ensureCompanyForOwner, resolveCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/notify";
import EmployerProfile from "@/models/EmployerProfile";

function safeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function safeImage(value: string): boolean {
  return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(value) || safeUrl(value);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.profile.view", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const company = await ensureCompanyForOwner(auth.session.userId);
    // Session was loaded before the lazy company row existed; adopt the
    // company we just resolved ownership of before the scope check.
    auth.session.companyId = String(company._id);
    const denial = assertCompanyScope(auth.session, String(company._id));
    if (denial) return denial;
    const profile = company.employerProfileId
      ? await EmployerProfile.findById(company.employerProfileId).lean()
      : null;

    const completionFields = [
      company.name, company.description, company.industry, company.logo, company.website,
      company.email, company.phone, company.headquarters, company.address, company.city,
      company.country, company.companySize, company.foundedYear, company.companyType,
    ];
    const completed = completionFields.filter((v) => v !== undefined && v !== null && v !== "").length;
    return ok({
      company,
      profile,
      completion: Math.round((completed / completionFields.length) * 100),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.profile.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);

    const body = await readJson(request);
    const company = await ensureCompanyForOwner(auth.session.userId);

    const textFields = [
      "name", "description", "industry", "website", "email", "phone", "headquarters",
      "address", "city", "state", "country", "companySize", "companyType", "hiringInformation",
    ] as const;
    for (const field of textFields) {
      if (body[field] === undefined) continue;
      const value = cleanString(body[field], 5000);
      if (["website"].includes(field) && value && !safeUrl(value)) return fail("Website must be a valid HTTP(S) URL.", 400);
      if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return fail("Invalid company email.", 400);
      (company as unknown as Record<string, unknown>)[field] = value;
    }
    if (body.foundedYear !== undefined) {
      company.foundedYear = body.foundedYear ? clampNumber(body.foundedYear, 1800, new Date().getFullYear(), 0) : undefined;
    }
    for (const field of ["logo", "coverImage"] as const) {
      if (body[field] === undefined) continue;
      const value = cleanString(body[field], 3_000_000);
      if (value && !safeImage(value)) return fail(`${field} must be an image URL or a small image data URL.`, 400);
      (company as unknown as Record<string, unknown>)[field] = value;
    }
    if (body.profilePublic !== undefined) company.profilePublic = Boolean(body.profilePublic);
    if (body.socialLinks && typeof body.socialLinks === "object") {
      const links = body.socialLinks as Record<string, unknown>;
      company.socialLinks = {
        linkedin: cleanString(links.linkedin, 500),
        facebook: cleanString(links.facebook, 500),
        instagram: cleanString(links.instagram, 500),
      };
    }
    await company.save();

    if (company.employerProfileId) {
      const updates: Record<string, unknown> = {};
      const map: Record<string, string> = {
        name: "companyName",
        description: "description",
        industry: "industry",
        website: "website",
        logo: "companyLogo",
        companySize: "companySize",
        phone: "phone",
      };
      for (const [from, to] of Object.entries(map)) {
        if (body[from] !== undefined) updates[to] = cleanString(body[from], 5000);
      }
      if (body.location !== undefined) updates.location = cleanString(body.location, 300);
      if (Object.keys(updates).length) {
        await EmployerProfile.findByIdAndUpdate(company.employerProfileId, { $set: updates });
      }
    }

    await logActivity({
      session: auth.session,
      action: "company.profile.updated",
      entity: "Company",
      entityId: companyId,
      description: "Updated company profile.",
    });
    return ok({ company });
  } catch (error) {
    return handleError(error);
  }
}
