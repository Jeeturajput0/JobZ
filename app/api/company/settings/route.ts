import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/notify";
import Company from "@/models/Company";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.dashboard.view", "company.settings.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);
    const [company, user] = await Promise.all([
      Company.findById(companyId).lean(),
      User.findById(auth.session.userId).select("fullName email phone status role").lean(),
    ]);
    return ok({ company, user, preferences: (company?.settings || {}) as Record<string, unknown> });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.settings.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);
    const body = await readJson(request);
    const company = await Company.findById(companyId);
    if (!company) return fail("Company not found.", 404);
    const pref = body.preferences && typeof body.preferences === "object" && !Array.isArray(body.preferences)
      ? body.preferences as Record<string, unknown>
      : body;
    const asBool = (v: unknown) => v === true || v === "true" || v === "1";
    const settings = { ...(company.settings || {}) } as Record<string, unknown>;
    for (const key of ["emailNotifications", "applicationAlerts", "interviewReminders", "recommendationAlerts", "partnershipAlerts", "weeklyDigest"]) {
      if (pref[key] !== undefined) settings[key] = asBool(pref[key]);
    }
    for (const key of ["recruitmentPreferences", "privacySettings"]) {
      if (pref[key] !== undefined) settings[key] = pref[key];
    }
    company.settings = settings;
    await company.save();
    await logActivity({ session: auth.session, action: "company.settings.updated", entity: "Company", entityId: companyId, description: "Updated company settings." });
    return ok({ message: "Settings saved." });
  } catch (error) {
    return handleError(error);
  }
}
