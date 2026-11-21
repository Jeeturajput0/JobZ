import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError, readJson } from "@/lib/api";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const [user, profile] = await Promise.all([
      User.findById(auth.session.userId).select("fullName email phone status createdAt").lean(),
      JobSeekerProfile.findOne({ userId: auth.session.userId }).select("resumePublic consentShareWithCompanies sharedFields counselingOptIn settings").lean(),
    ]);
    return ok({ user, profile });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const updates: Record<string, unknown> = {};
    const pref = body.preferences && typeof body.preferences === "object" && !Array.isArray(body.preferences)
      ? body.preferences as Record<string, unknown>
      : body;
    const asBool = (value: unknown) => value === true || value === "true" || value === "1";
    for (const key of ["emailNotifications", "applicationUpdates", "interviewReminders", "marketing", "profileVisibility", "dataSharing"]) {
      if (pref[key] !== undefined) updates[`settings.${key}`] = asBool(pref[key]);
    }
    if (body.resumePublic !== undefined) updates.resumePublic = asBool(body.resumePublic);
    if (body.consentShareWithCompanies !== undefined) updates.consentShareWithCompanies = asBool(body.consentShareWithCompanies);
    if (body.counselingOptIn !== undefined) updates.counselingOptIn = asBool(body.counselingOptIn);
    if (!Object.keys(updates).length) return ok({ message: "No changes provided." });
    await JobSeekerProfile.findOneAndUpdate(
      { userId: auth.session.userId },
      { $set: updates },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return ok({ message: "Settings saved." });
  } catch (error) {
    return handleError(error);
  }
}
