import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.users.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { role: "jobSeeker" };
    if (sp.get("status")) query.status = sp.get("status");
    const search = sp.get("search")?.trim();
    if (search) query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const skill = sp.get("skill")?.trim();
    const verification = sp.get("verification");
    const minCompletion = Number(sp.get("minCompletion")) || 0;
    const profileQuery: Record<string, unknown> = {};
    if (skill) profileQuery.skills = { $regex: skill, $options: "i" };
    if (verification) profileQuery.verificationStatus = verification;
    if (Object.keys(profileQuery).length || minCompletion > 0) {
      const profiles = await JobSeekerProfile.find(profileQuery).select("userId").lean();
      let ids = profiles.map((p) => String(p.userId));
      if (minCompletion > 0) {
        // Completion is derived; filter in-memory against real field counts.
        const rich = await JobSeekerProfile.find({ userId: { $in: ids } }).lean();
        ids = rich
          .filter((p) => {
            const basic = [p.headline, p.summary, p.location, p.resumeUrl].filter(Boolean).length;
            const score = Math.round(
              (Math.min(5, basic) / 5) * 15 +
              ((p.education?.length || 0) ? 15 : 0) +
              ((p.skills?.length || 0) >= 3 ? 15 : 0) +
              (p.resumeUrl ? 15 : 0) +
              ((p.projects?.length || 0) ? 10 : 0) +
              ((p.achievements?.length || 0) ? 5 : 0) +
              (p.careerGoals ? 10 : 0) +
              (((p.jobPreferences?.roles?.length || 0) > 0) ? 10 : 0) +
              (((p.experience?.length || 0) || (p.projects?.length || 0)) ? 5 : 0),
            );
            return score >= minCompletion;
          })
          .map((p) => String(p.userId));
      }
      query._id = { $in: ids };
    }

    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    const ids = users.map((u) => String(u._id));
    const [profiles, applicationCounts] = await Promise.all([
      JobSeekerProfile.find({ userId: { $in: ids } }).lean(),
      Application.aggregate([
        { $match: { jobSeekerId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: "$jobSeekerId", count: { $sum: 1 } } },
      ]),
    ]);
    const profileById = new Map(profiles.map((p) => [String(p.userId), p]));
    const countById = new Map(applicationCounts.map((a) => [String(a._id), a.count]));
    const seekers = users.map((u) => ({
      ...u,
      profile: profileById.get(String(u._id)) || null,
      applications: countById.get(String(u._id)) || 0,
    }));
    return ok({ seekers, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
