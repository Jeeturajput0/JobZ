import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, toObjectId, isObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { hasPermission } from "@/lib/permissions";
import { buildCandidateView } from "@/lib/candidate-view";
import { logActivity, notify } from "@/lib/notify";
import { APPLICATION_STATUSES } from "@/lib/constants";
import Application from "@/models/Application";
import Interview from "@/models/Interview";

interface Ctx { params: Promise<{ id: string }> }

const FORWARD: Record<string, string[]> = {
  applied: ["underReview", "atsEvaluation", "shortlisted", "rejected", "withdrawn"],
  underReview: ["atsEvaluation", "shortlisted", "rejected", "withdrawn"],
  atsEvaluation: ["shortlisted", "rejected", "withdrawn"],
  shortlisted: ["interviewScheduled", "selected", "rejected", "withdrawn"],
  interviewScheduled: ["interviewCompleted", "selected", "rejected", "withdrawn"],
  interviewCompleted: ["selected", "rejected", "withdrawn"],
  selected: ["offerReceived", "hired", "rejected"],
  offerReceived: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
  pending: ["reviewed", "shortlisted", "rejected"],
  reviewed: ["shortlisted", "rejected"],
  interview: ["interviewCompleted", "selected", "rejected"],
};

async function ownedApplication(request: NextRequest, id: string) {
  const auth = await requirePermission(request, ["company.applications.view"]);
  if (!auth.authorized) return { auth, application: null };
  const companyId = await resolveCompanyId(auth.session);
  const denial = assertCompanyScope(auth.session, companyId);
  if (denial) return { auth, application: null, denial };
  const application = await Application.findOne({ _id: id, companyId });
  return { auth, application, companyId };
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const id = requireObjectId((await ctx.params).id, "application id");
    const { auth, application, denial } = await ownedApplication(request, id);
    if (!auth.authorized) return auth.response;
    if (denial) return denial;
    if (!application) return fail("Application not found for your company.", 404);

    const candidate = await buildCandidateView(String(application.jobSeekerId), auth.session, "company");
    const interviews = await Interview.find({ applicationId: id }).sort({ scheduledAt: -1 }).lean();
    return ok({ application, candidate, interviews });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const id = requireObjectId((await ctx.params).id, "application id");
    const { auth, application, denial } = await ownedApplication(request, id);
    if (!auth.authorized) return auth.response;
    if (denial) return denial;
    if (!application) return fail("Application not found for your company.", 404);
    const body = await readJson(request);
    let changed = false;

    if (body.status !== undefined) {
      const status = String(body.status);
      if (!APPLICATION_STATUSES.includes(status as never)) return fail("Invalid application status.", 400);
      const current = application.status;
      if (current !== status && !(FORWARD[current] || []).includes(status)) {
        return fail(`Cannot move from ${current} to ${status}.`, 409);
      }
      if (["shortlisted", "rejected"].includes(status) && !hasPermission(auth.session.permissions, status === "shortlisted" ? "company.candidates.shortlist" : "company.candidates.reject")) {
        return fail("You do not have permission for this decision.", 403);
      }
      application.status = status;
      application.timeline.push({ status, note: cleanString(body.note, 1000), by: toObjectId(auth.session.userId)!, at: new Date() });
      changed = true;
    }
    if (body.note !== undefined && body.status === undefined) {
      application.feedback = `${application.feedback || ""}\n[${auth.session.fullName}] ${cleanString(body.note, 2000)}`.trim();
      changed = true;
    }
    if (body.assignedTo !== undefined) {
      if (!hasPermission(auth.session.permissions, "company.candidates.assign")) return fail("You cannot assign applicants.", 403);
      application.assignedTo = isObjectId(body.assignedTo) ? toObjectId(body.assignedTo) : null;
      application.timeline.push({ status: application.status, note: "Assignment updated", by: toObjectId(auth.session.userId)!, at: new Date() });
      changed = true;
    }
    if (!changed) return fail("No supported changes provided.", 400);
    await application.save();

    await logActivity({
      session: auth.session,
      action: "application.updated",
      entity: "Application",
      entityId: id,
      description: `Updated application status to ${application.status}.`,
    });
    await notify({
      userId: String(application.jobSeekerId),
      type: "application.status",
      title: "Application status updated",
      message: `Your application status is now ${application.status}.`,
      link: "/profile/applications",
    });
    return ok({ application });
  } catch (error) {
    return handleError(error);
  }
}
