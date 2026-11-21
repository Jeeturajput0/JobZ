import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, toObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import Interview from "@/models/Interview";
import Application from "@/models/Application";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.interviews.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "interview id");
    const interview = await Interview.findOne({ _id: id, companyId });
    if (!interview) return fail("Interview not found.", 404);
    const body = await readJson(request);

    if (body.status !== undefined && ["scheduled", "completed", "cancelled", "rescheduled"].includes(String(body.status))) {
      interview.status = String(body.status) as typeof interview.status;
      if (interview.status === "completed" && interview.applicationId) {
        const application = await Application.findById(interview.applicationId);
        if (application) {
          application.status = "interviewCompleted";
          application.timeline.push({ status: "interviewCompleted", by: toObjectId(auth.session.userId)!, at: new Date() });
          await application.save();
        }
      }
    }
    if (body.scheduledAt !== undefined) {
      const date = new Date(String(body.scheduledAt));
      if (!Number.isNaN(date.getTime())) interview.scheduledAt = date;
    }
    if (body.feedback !== undefined) {
      const rating = Number(body.rating) || 0;
      interview.feedback.push({
        by: toObjectId(auth.session.userId)!,
        rating,
        notes: cleanString(body.feedback, 4000),
        decision: (["positive", "neutral", "negative"].includes(String(body.decision)) ? String(body.decision) : "neutral") as "positive" | "neutral" | "negative",
        at: new Date(),
      });
    }
    await interview.save();
    await logActivity({
      session: auth.session,
      action: "interview.updated",
      entity: "Interview",
      entityId: id,
      description: "Updated an interview.",
    });
    if (body.status === "cancelled" || body.status === "rescheduled") {
      await notify({
        userId: String(interview.candidateId),
        type: "interview.changed",
        title: "Interview update",
        message: `Your interview has been ${interview.status}.`,
        link: "/profile/applications",
      });
    }
    return ok({ interview });
  } catch (error) {
    return handleError(error);
  }
}
