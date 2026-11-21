import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import Assessment from "@/models/Assessment";
import AssessmentAttempt from "@/models/AssessmentAttempt";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "assessment id");
    const assessment = await Assessment.findOne({ _id: id, status: "active" }).lean();
    if (!assessment) return fail("Assessment not found.", 404);

    // Strip answer keys — they must never be sent to the candidate's browser.
    const questions = assessment.questions.map((q) => ({
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      points: q.points,
      difficulty: q.difficulty,
      skill: q.skill,
    }));
    const previousAttempts = await AssessmentAttempt.countDocuments({ candidateId: auth.session.userId, assessmentId: id, status: "completed" });
    if (!assessment.retakeAllowed && previousAttempts > 0) {
      return fail("This assessment can only be attempted once.", 409);
    }
    if (previousAttempts >= assessment.maxAttempts) {
      return fail("You have reached the maximum number of attempts.", 409);
    }
    return ok({
      assessment: {
        id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        category: assessment.category,
        skills: assessment.skills,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        questionCount: questions.length,
        questions,
        isAiAssisted: assessment.isAiAssisted,
      },
      previousAttempts,
    });
  } catch (error) {
    return handleError(error);
  }
}
