import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId, isObjectId, parsePagination } from "@/lib/api";
import { ensureCounselingRecord } from "@/lib/counseling";
import { logActivity, notify } from "@/lib/notify";
import { publicUsername } from "@/lib/public-profile";
import { getAccessibleCounselingCandidateIds } from "@/lib/counseling";
import { buildCandidateView } from "@/lib/candidate-view";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import CounselingRecord from "@/models/CounselingRecord";
import AssessmentAttempt from "@/models/AssessmentAttempt";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.candidates.view", "counseling.candidates.viewAll", "counseling.candidates.search"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;

    const allowed = await getAccessibleCounselingCandidateIds(auth.session);
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { role: "jobSeeker" };
    if (allowed !== null) query._id = { $in: allowed };

    const search = sp.get("search")?.trim();
    if (search) query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const skill = sp.get("skill")?.trim();
    const location = sp.get("location")?.trim();
    const verification = sp.get("verification");
    const minCompletion = Number(sp.get("minCompletion")) || 0;
    const minAssessment = Number(sp.get("minAssessment")) || 0;
    const roleGoal = sp.get("careerGoal")?.trim();

    const profileQuery: Record<string, unknown> = {};
    if (skill) profileQuery.skills = { $regex: skill, $options: "i" };
    if (location) profileQuery.location = { $regex: location, $options: "i" };
    if (verification) profileQuery.verificationStatus = verification;
    if (roleGoal) {
      profileQuery.$or = [
        { careerGoals: { $regex: roleGoal, $options: "i" } },
        { "jobPreferences.roles": { $regex: roleGoal, $options: "i" } },
      ];
    }
    let profileIds: string[] | null = null;
    if (Object.keys(profileQuery).length) {
      const profiles = await JobSeekerProfile.find(profileQuery).select("userId").lean();
      profileIds = profiles.map((p) => String(p.userId));
    }

    let assessmentIds: string[] | null = null;
    if (minAssessment > 0) {
      const attempts = await AssessmentAttempt.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$candidateId", best: { $max: "$percentage" } } },
        { $match: { best: { $gte: minAssessment } } },
      ]);
      assessmentIds = attempts.map((a) => String(a._id));
    }

    let completionIds: string[] | null = null;
    if (minCompletion > 0 && auth.session.counselingTeamId) {
      const records = await CounselingRecord.find({
        teamId: auth.session.counselingTeamId,
        profileCompletion: { $gte: minCompletion },
      }).select("candidateId").lean();
      completionIds = records.map((r) => String(r.candidateId));
    }

    const filters = [allowed, profileIds, assessmentIds, completionIds].filter((f): f is string[] => f !== null);
    if (filters.length) {
      const intersection = filters.reduce((acc, ids) => acc.filter((id) => ids.includes(id)));
      if (allowed !== null) query._id = { $in: intersection };
      else query._id = { $in: intersection };
    }

    const [users, total] = await Promise.all([
      User.find(query).select("fullName email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    const candidates = [];
    for (const u of users) {
      const view = await buildCandidateView(String(u._id), auth.session, "counseling");
      if (view) candidates.push(view);
    }
    return ok({ candidates, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Adds a candidate to this counseling organization. If the person already has
 * a JobZ candidate account, only a counseling association is created — never
 * a duplicate user document.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.candidates.edit", "counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    if (!auth.session.counselingTeamId) return fail("No counseling organization is linked to your account.", 403);

    const body = await readJson(request);
    const fullName = cleanString(body.fullName, 80);
    const email = cleanString(body.email, 254).toLowerCase();
    if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail("A valid name and email are required.", 400);
    }
    if (isObjectId(body.assignedTo)) {
      const counselor = await User.findOne({
        _id: body.assignedTo,
        counselingTeamId: auth.session.counselingTeamId,
        role: { $in: ["counselingAdmin", "counselingMember"] },
      }).select("_id");
      if (!counselor) return fail("The selected counselor does not belong to your organization.", 403);
    }

    let user = await User.findOne({ email });
    let createdAccount = false;
    let temporaryPassword = "";
    if (user && user.role !== "jobSeeker") {
      return fail("An account with this email exists with a different role.", 409);
    }
    if (!user) {
      temporaryPassword = cleanString(body.password, 72) || randomBytes(9).toString("base64url");
      if (temporaryPassword.length < 8) return fail("Password must be at least 8 characters.", 400);
      user = await User.create({
        fullName,
        email,
        password: await bcrypt.hash(temporaryPassword, 12),
        phone: cleanString(body.phone, 30),
        role: "jobSeeker",
        invitedBy: auth.session.userId,
      });
      user.username = publicUsername(fullName, user._id);
      await user.save();
      createdAccount = true;
    }

    const skillList = cleanStringArray(body.skills, 30, 120);
    const update: Record<string, unknown> = {
      $set: {
        headline: cleanString(body.preferredJob, 180),
        location: cleanString(body.preferredLocation, 200),
        phone: cleanString(body.phone, 30),
        counselingOptIn: true,
      },
    };
    if (skillList.length) update.$addToSet = { skills: { $each: skillList } };
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { userId: user._id },
      update as never,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const record = await ensureCounselingRecord(
      auth.session.counselingTeamId,
      String(user._id),
      isObjectId(body.assignedTo) ? body.assignedTo : undefined,
    );
    if (cleanString(body.notes, 3000)) {
      record.suggestions.push(cleanString(body.notes, 3000));
      record.history.push({ status: record.workflowStatus, note: "Candidate added to counseling", by: toObjectId(auth.session.userId), at: new Date() });
      await record.save();
    }

    await logActivity({
      session: auth.session,
      action: createdAccount ? "counseling.candidate.invited" : "counseling.candidate.associated",
      entity: "User",
      entityId: String(user._id),
      description: `${createdAccount ? "Invited" : "Associated"} candidate ${email} to the counseling organization.`,
    });
    await notify({
      userId: String(user._id),
      type: "counseling.invitation",
      title: "A counseling organization added you",
      message: "You were added to a counseling organization on JobZ. Review your profile and consent settings.",
      link: "/profile",
    });
    return created({ candidateId: String(user._id), createdAccount, temporaryPassword, profileId: String(profile._id), recordId: String(record._id) });
  } catch (error) {
    return handleError(error);
  }
}

