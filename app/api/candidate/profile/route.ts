import { NextRequest } from "next/server";
import { requireJobSeeker, assertSelfOrAdmin } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, cleanStringArray, clampNumber, isObjectId, toObjectId } from "@/lib/api";
import { getCompletionWeights } from "@/lib/settings";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import User from "@/models/User";
import CandidateDocument from "@/models/CandidateDocument";

function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidInlineImage(value: string): boolean {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return false;
  return Math.floor((match[2].length * 3) / 4) <= 1024 * 1024;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const denial = assertSelfOrAdmin(auth.session, auth.session.userId);
    if (denial) return denial;
    const profile = await JobSeekerProfile.findOne({ userId: auth.session.userId }).lean();
    const user = await User.findById(auth.session.userId).select("fullName phone email").lean();
    const completion = calculateProfileCompletion(profile, user, await getCompletionWeights());
    return ok({ profile, user, completion });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    let profile = await JobSeekerProfile.findOne({ userId: auth.session.userId });
    if (!profile) {
      profile = new JobSeekerProfile({ userId: auth.session.userId });
    }

    const textFields = [
      "headline", "summary", "location", "city", "state", "country", "phone",
      "careerGoals", "careerLevel", "portfolioUrl", "linkedInUrl", "profileImage",
      "gender", "availability", "noticePeriod", "preferredEmploymentType",
    ];
    for (const field of textFields) {
      if (body[field] === undefined) continue;
      const value = cleanString(body[field], 5000);
      if (["portfolioUrl", "linkedInUrl"].includes(field) && value) {
        if (!isSafeExternalUrl(value)) return fail(`${field} must be a valid HTTP or HTTPS URL.`, 400);
      }
      if (field === "profileImage" && value && !isValidInlineImage(value)) {
        return fail("Profile image must be a small PNG, JPEG or WebP image.", 400);
      }
      (profile as unknown as Record<string, unknown>)[field] = value;
    }
    if (body.resumeUrl !== undefined) {
      const value = cleanString(body.resumeUrl, 2000);
      if (value && !isSafeExternalUrl(value) && !/^\/api\/candidate\/documents\/[a-f\d]{24}$/i.test(value)) {
        return fail("Resume must be a valid HTTP(S) URL or a private document reference.", 400);
      }
      if (value !== profile.resumeUrl) profile.resumePublic = false;
      profile.resumeUrl = value;
    }
    for (const field of ["languages", "preferredLocations", "skills"]) {
      if (body[field] !== undefined) (profile as unknown as Record<string, unknown>)[field] = cleanStringArray(body[field], 50, 120);
    }
    if (body.skillLevels !== undefined && typeof body.skillLevels === "object") {
      const levels: Record<string, string> = {};
      for (const [key, value] of Object.entries(body.skillLevels as Record<string, unknown>)) {
        if (typeof value === "string") levels[cleanString(key, 80)] = cleanString(value, 40);
      }
      profile.skillLevels = levels;
    }
    if (body.expectedSalary !== undefined) profile.expectedSalary = clampNumber(body.expectedSalary, 0, 100000000, 0);
    if (body.dateOfBirth !== undefined) {
      const dob = body.dateOfBirth ? new Date(String(body.dateOfBirth)) : null;
      if (dob && Number.isNaN(dob.getTime())) return fail("Invalid date of birth.", 400);
      profile.dateOfBirth = dob;
    }
    if (body.resumePublic !== undefined) profile.resumePublic = Boolean(body.resumePublic);
    if (body.preferredResumeId !== undefined) {
      if (body.preferredResumeId && !isObjectId(body.preferredResumeId)) return fail("Invalid resume selection.", 400);
      if (body.preferredResumeId) {
        const document = await CandidateDocument.findOne({
          _id: body.preferredResumeId,
          candidateId: auth.session.userId,
          type: "resume",
        }).select("_id");
        if (!document) return fail("The selected resume does not belong to you.", 403);
      }
      profile.preferredResumeId = toObjectId(body.preferredResumeId);
    }

    const collectionFields = ["education", "experience", "projects", "achievements", "certifications"] as const;
    for (const field of collectionFields) {
      if (body[field] !== undefined) {
        if (!Array.isArray(body[field])) return fail(`${field} must be an array.`, 400);
        (profile as unknown as Record<string, unknown>)[field] = body[field].slice(0, 50);
      }
    }
    if (body.jobPreferences !== undefined && typeof body.jobPreferences === "object") {
      const prefs = body.jobPreferences as Record<string, unknown>;
      profile.jobPreferences = {
        roles: cleanStringArray(prefs.roles, 30, 120),
        locations: cleanStringArray(prefs.locations, 30, 120),
        jobTypes: cleanStringArray(prefs.jobTypes, 10, 40),
        workModes: cleanStringArray(prefs.workModes, 10, 40),
        minSalary: clampNumber(prefs.minSalary, 0, 100000000, 0),
        maxSalary: clampNumber(prefs.maxSalary, 0, 100000000, 0),
        openToRelocation: Boolean(prefs.openToRelocation),
        remoteOnly: Boolean(prefs.remoteOnly),
      };
    }
    if (body.consentShareWithCompanies !== undefined) profile.consentShareWithCompanies = Boolean(body.consentShareWithCompanies);
    if (body.sharedFields !== undefined) profile.sharedFields = cleanStringArray(body.sharedFields, 30, 60);
    if (body.counselingOptIn !== undefined) profile.counselingOptIn = Boolean(body.counselingOptIn);

    await profile.save();
    const userUpdates: Record<string, unknown> = {
      phone: cleanString(body.phone, 30) || auth.session.user.phone || "",
    };
    if (body.fullName !== undefined) {
      const fullName = cleanString(body.fullName, 80);
      if (fullName.length < 2) return fail("Full name must be at least 2 characters.", 400);
      userUpdates.fullName = fullName;
    }
    await User.findByIdAndUpdate(auth.session.userId, { $set: userUpdates });
    const completion = calculateProfileCompletion(profile, await User.findById(auth.session.userId).select("fullName phone").lean(), await getCompletionWeights());
    return ok({ profile, completion });
  } catch (error) {
    return handleError(error);
  }
}
