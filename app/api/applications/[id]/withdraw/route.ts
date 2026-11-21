import { NextRequest } from "next/server";
import { requireSession, forbidden, unauthorized } from "@/lib/session";
import { ok, fail, handleError, requireObjectId, toObjectId } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import Application from "@/models/Application";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const session = await requireSession(request);
    if (!session.authorized) return unauthorized();
    if (session.session.role !== "jobSeeker") return forbidden("Only the candidate who applied can withdraw this application.");
    const id = requireObjectId((await ctx.params).id, "application id");
    const application = await Application.findById(id);
    if (!application) return fail("Application not found.", 404);
    if (String(application.jobSeekerId) !== session.session.userId) return forbidden("You can only withdraw your own applications.");
    if (!["applied", "underReview", "atsEvaluation"].includes(application.status)) {
      return fail("This application can no longer be withdrawn because recruitment has advanced.", 409);
    }

    application.status = "withdrawn";
    application.timeline.push({ status: "withdrawn", note: "Withdrawn by candidate", by: toObjectId(session.session.userId)!, at: new Date() });
    await application.save();

    await notify({
      userId: String(application.employerId),
      type: "application.withdrawn",
      title: "Application withdrawn",
      message: "A candidate withdrew their application.",
      link: "/employer/applicants",
    });
    await logActivity({
      session: session.session,
      action: "application.withdrawn",
      entity: "Application",
      entityId: id,
      description: "Candidate withdrew an application.",
    });
    return ok({ application });
  } catch (error) {
    return handleError(error);
  }
}
