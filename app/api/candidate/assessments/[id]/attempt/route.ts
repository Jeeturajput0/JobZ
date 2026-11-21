import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, fail, handleError, readJson, requireObjectId, toObjectId } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import Assessment from "@/models/Assessment";
import AssessmentAttempt from "@/models/AssessmentAttempt";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "assessment id");
    const assessment = await Assessment.findOne({ _id: id, status: "active" });
    if (!assessment) return fail("Assessment not found.", 404);
    const attempts = await AssessmentAttempt.countDocuments({ candidateId: auth.session.userId, assessmentId: id, status: "completed" });
    if (!assessment.retakeAllowed && attempts > 0) return fail("Retakes are not allowed for this assessment.", 409);
    if (attempts >= assessment.maxAttempts) return fail("Maximum attempts reached.", 409);

    const body = await readJson(request);
    const answers = Array.isArray(body.answers) ? body.answers.slice(0, 200) : [];
    let score = 0;
    let maxScore = 0;
    const skillTotals: Record<string, { earned: number; max: number }> = {};
    const graded = assessment.questions.map((question, index) => {
      const answer = (answers.find((a: unknown) => {
        const obj = a as Record<string, unknown>;
        return Number(obj?.questionIndex) === index;
      }) || {}) as Record<string, unknown>;
      const selected = Array.isArray(answer.selectedKeys)
        ? answer.selectedKeys.filter((k): k is string => typeof k === "string")
        : [];
      const correct = question.correctKeys || [];
      const isCorrect =
        question.type === "single"
          ? selected.length === 1 && correct.includes(selected[0])
          : question.type === "multiple"
            ? selected.length > 0 && selected.every((k) => correct.includes(k)) && selected.length === correct.length
            : false; // text/code answers require human review; no automatic score
      const earned = isCorrect ? question.points : 0;
      score += earned;
      maxScore += question.points;
      if (question.skill) {
        skillTotals[question.skill] = skillTotals[question.skill] || { earned: 0, max: 0 };
        skillTotals[question.skill].earned += earned;
        skillTotals[question.skill].max += question.points;
      }
      return { questionIndex: index, selectedKeys: selected, textAnswer: typeof answer.textAnswer === "string" ? answer.textAnswer.slice(0, 10000) : "", earnedPoints: earned, correct: isCorrect };
    });

    const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;
    const skillScores = Object.entries(skillTotals).map(([skill, totals]) => ({
      skill,
      score: totals.max ? Math.round((totals.earned / totals.max) * 100) : 0,
    }));
    const strengths = skillScores.filter((s) => s.score >= 70).map((s) => s.skill);
    const improvements = skillScores.filter((s) => s.score < 70).map((s) => s.skill);

    const attempt = await AssessmentAttempt.create({
      assessmentId: toObjectId(id)!,
      candidateId: toObjectId(auth.session.userId)!,
      answers: graded,
      score,
      maxScore,
      percentage,
      skillScores,
      strengths,
      improvements,
      recommendedAssessments: improvements.slice(0, 3),
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
    });

    await logActivity({ session: auth.session, action: "assessment.completed", entity: "AssessmentAttempt", entityId: String(attempt._id), description: `Completed assessment ${assessment.title}.` });
    await notify({
      userId: auth.session.userId,
      type: "assessment.result",
      title: "Assessment result available",
      message: `You scored ${percentage}% on ${assessment.title}.`,
      link: "/profile/career-progress",
    });
    return ok({
      attempt: {
        id: attempt._id,
        score,
        maxScore,
        percentage,
        skillScores,
        strengths,
        improvements,
        passed: percentage >= assessment.passingScore,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
