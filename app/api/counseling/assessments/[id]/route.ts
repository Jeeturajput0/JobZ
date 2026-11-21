import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, requireObjectId } from "@/lib/api";
import Assessment from "@/models/Assessment";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.assessments.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "assessment id");
    const assessment = await Assessment.findById(id);
    if (!assessment) return fail("Assessment not found.", 404);
    const body = await readJson(request);
    if (body.status !== undefined && ["draft", "active", "inactive"].includes(String(body.status))) {
      assessment.status = String(body.status) as typeof assessment.status;
    }
    if (body.passingScore !== undefined) assessment.passingScore = Number(body.passingScore) || assessment.passingScore;
    if (body.retakeAllowed !== undefined) assessment.retakeAllowed = Boolean(body.retakeAllowed);
    if (body.maxAttempts !== undefined) assessment.maxAttempts = Number(body.maxAttempts) || assessment.maxAttempts;
    await assessment.save();
    return ok({ assessment });
  } catch (error) {
    return handleError(error);
  }
}
