import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Assessment from "@/models/Assessment";
import AssessmentAttempt from "@/models/AssessmentAttempt";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const type = sp.get("type");
    const query: Record<string, unknown> = { status: "active" };
    if (type) query.type = type;
    const [assessments, total, attempts] = await Promise.all([
      Assessment.find(query)
        .select("title description type category skills difficulty durationMinutes passingScore maxAttempts questionCount isAiAssisted")
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Assessment.countDocuments(query),
      AssessmentAttempt.find({ candidateId: auth.session.userId, status: "completed" })
        .select("assessmentId percentage skillScores strengths improvements completedAt")
        .sort({ completedAt: -1 })
        .limit(50)
        .lean(),
    ]);
    return ok({ assessments, attempts, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
