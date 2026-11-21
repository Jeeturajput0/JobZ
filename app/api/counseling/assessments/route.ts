import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, oneOf } from "@/lib/api";
import { ASSESSMENT_TYPES } from "@/lib/constants";
import Assessment from "@/models/Assessment";
import type { IAssessmentQuestion } from "@/models/Assessment";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.assessments.manage", "counseling.assessments.viewResults"]);
    if (!auth.authorized) return auth.response;
    const assessments = await Assessment.find({}).select("-__v").sort({ createdAt: -1 }).lean();
    return ok({ assessments });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.assessments.manage"]);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const title = cleanString(body.title, 180);
    if (!title) return fail("Title is required.", 400);
    const type = oneOf(body.type, ASSESSMENT_TYPES, "assessment type");
    const questions: IAssessmentQuestion[] = Array.isArray(body.questions)
      ? body.questions.slice(0, 100).map((q: unknown) => {
          const item = (q || {}) as Record<string, unknown>;
          const options = Array.isArray(item.options)
            ? item.options.slice(0, 8).map((o: unknown) => {
                const opt = (o || {}) as Record<string, unknown>;
                return { key: cleanString(opt.key, 10), text: cleanString(opt.text, 300) };
              })
            : [];
          return {
            prompt: cleanString(item.prompt, 1000),
            type: (["single", "multiple", "text", "code"].includes(String(item.type)) ? String(item.type) : "single") as IAssessmentQuestion["type"],
            options,
            correctKeys: cleanStringArray(item.correctKeys, 8, 10),
            explanation: cleanString(item.explanation, 1000),
            points: Number(item.points) || 1,
            difficulty: (["easy", "medium", "hard"].includes(String(item.difficulty)) ? String(item.difficulty) : "medium") as IAssessmentQuestion["difficulty"],
            skill: cleanString(item.skill, 80),
          };
        })
      : [];
    if (!questions.length) return fail("At least one question is required.", 400);

    const assessment = await Assessment.create({
      title,
      description: cleanString(body.description, 3000),
      type,
      category: cleanString(body.category, 80) || "General",
      skills: cleanStringArray(body.skills, 30, 80),
      difficulty: (["easy", "medium", "hard"].includes(String(body.difficulty)) ? String(body.difficulty) : "medium") as "easy" | "medium" | "hard",
      durationMinutes: Number(body.durationMinutes) || 20,
      questions,
      passingScore: Number(body.passingScore) || 60,
      retakeAllowed: body.retakeAllowed !== false,
      maxAttempts: Number(body.maxAttempts) || 3,
      status: (["draft", "active", "inactive"].includes(String(body.status)) ? String(body.status) : "active") as "draft" | "active" | "inactive",
      createdBy: auth.session.userId,
      isAiAssisted: false,
    });
    return created({ assessment });
  } catch (error) {
    return handleError(error);
  }
}
