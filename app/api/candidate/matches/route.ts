import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import { publicJobFilter } from "@/lib/public-jobs";
import { computeJobMatch } from "@/lib/matching";
import { getMatchWeights } from "@/lib/settings";
import Job from "@/models/Job";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import AssessmentAttempt from "@/models/AssessmentAttempt";
import JobMatch from "@/models/JobMatch";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const minScore = Number(sp.get("minScore")) || 0;
    const category = sp.get("category");
    const query: Record<string, unknown> = { ...publicJobFilter() };
    if (category) query.category = category;

    const [jobs, profile, attempts, weights] = await Promise.all([
      Job.find(query).select("-reviewedBy -reviewedAt").sort({ createdAt: -1 }).limit(300).lean(),
      JobSeekerProfile.findOne({ userId: auth.session.userId }).lean(),
      AssessmentAttempt.find({ candidateId: auth.session.userId, status: "completed" })
        .select("skillScores percentage")
        .sort({ completedAt: -1 })
        .limit(10)
        .lean(),
      getMatchWeights(),
    ]);

    const skillScores = attempts.flatMap((a) => a.skillScores || []);
    const matches = jobs.map((job) => {
      const result = computeJobMatch({ profile, job, skillScores, weights });
      return {
        job,
        match: {
          score: result.score,
          weightsVersion: result.weightsVersion,
          breakdown: result.breakdown,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          explanation: result.explanation,
          recommendedActions: result.recommendedActions,
        },
      };
    });

    // Persist top matches so counselors/super admins can inspect them later.
    const top = matches.slice(0, 25);
    await Promise.all(
      top.map((m) =>
        JobMatch.findOneAndUpdate(
          { candidateId: auth.session.userId, jobId: m.job._id },
          {
            $set: {
              score: m.match.score,
              breakdown: m.match.breakdown,
              matchedSkills: m.match.matchedSkills,
              missingSkills: m.match.missingSkills,
              explanation: m.match.explanation,
              recommendedActions: m.match.recommendedActions,
              weightsVersion: m.match.weightsVersion,
            },
          },
          { upsert: true },
        ),
      ),
    );

    const filtered = matches
      .filter((m) => m.match.score >= minScore)
      .sort((a, b) => b.match.score - a.match.score);
    return ok({
      matches: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
    });
  } catch (error) {
    return handleError(error);
  }
}
