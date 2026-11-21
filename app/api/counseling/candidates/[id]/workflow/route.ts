import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId, requireObjectId } from "@/lib/api";
import { getAccessibleCounselingCandidateIds, ensureCounselingRecord } from "@/lib/counseling";
import { CANDIDATE_WORKFLOW_STAGES } from "@/lib/constants";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";
import { logActivity, notify } from "@/lib/notify";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import User from "@/models/User";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.candidates.edit", "counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const candidateId = requireObjectId((await ctx.params).id, "candidate id");
    const allowed = await getAccessibleCounselingCandidateIds(auth.session);
    if (allowed !== null && !allowed.includes(candidateId)) return fail("This candidate is not assigned to you.", 403);
    if (!auth.session.counselingTeamId) return fail("No counseling team is linked to your account.", 403);

    const body = await readJson(request);
    const record = await ensureCounselingRecord(auth.session.counselingTeamId, candidateId);
    if (body.workflowStatus !== undefined) {
      const status = String(body.workflowStatus);
      if (!CANDIDATE_WORKFLOW_STAGES.includes(status as never)) return fail("Invalid workflow status.", 400);
      record.workflowStatus = status;
      record.history.push({ status, note: cleanString(body.note, 1000), by: toObjectId(auth.session.userId)!, at: new Date() });
    }
    if (body.assignedTo !== undefined) {
      record.assignedTo = toObjectId(body.assignedTo) || null;
    }
    if (body.suggestions !== undefined) {
      record.suggestions = cleanStringArray(body.suggestions, 50, 500);
    }
    if (body.task !== undefined && typeof body.task === "object") {
      const task = body.task as Record<string, unknown>;
      const title = cleanString(task.title, 200);
      if (title) {
        record.tasks.push({
          title,
          description: cleanString(task.description, 2000),
          status: "pending",
          dueDate: task.dueDate ? new Date(String(task.dueDate)) : null,
          createdBy: toObjectId(auth.session.userId)!,
          at: new Date(),
        });
      }
    }
    if (body.taskStatus !== undefined && body.taskId !== undefined) {
      const task = record.tasks.find((t) => String((t as { _id?: unknown })._id) === String(body.taskId));
      if (task && ["pending", "inProgress", "completed"].includes(String(body.taskStatus))) {
        task.status = String(body.taskStatus) as typeof task.status;
      }
    }

    const [profile, user] = await Promise.all([
      JobSeekerProfile.findOne({ userId: candidateId }).lean(),
      User.findById(candidateId).select("fullName").lean(),
    ]);
    record.profileCompletion = calculateProfileCompletion(profile, user, await getCompletionWeights()).percentage;
    record.verificationStatus = profile?.verificationStatus || "notSubmitted";
    await record.save();

    await logActivity({
      session: auth.session,
      action: "counseling.workflow.updated",
      entity: "CounselingRecord",
      entityId: String(record._id),
      description: `Updated workflow for candidate ${candidateId}.`,
    });
    if (body.task) {
      await notify({
        userId: candidateId,
        type: "counseling.task",
        title: "New profile improvement task",
        message: "Your counselor assigned you a new task to improve your profile.",
        link: "/profile",
      });
    }
    return ok({ record });
  } catch (error) {
    return handleError(error);
  }
}
