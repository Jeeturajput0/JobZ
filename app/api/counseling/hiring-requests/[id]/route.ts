import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, toObjectId, requireObjectId } from "@/lib/api";
import { HIRING_REQUEST_STATUSES } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.hiringRequests.view", "counseling.hiringRequests.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "request id");
    const hiringRequest = await HiringRequest.findById(id).populate("createdBy", "fullName email").lean();
    if (!hiringRequest) return fail("Hiring request not found.", 404);
    const recommendations = await CandidateRecommendation.find({ hiringRequestId: id })
      .populate("candidateId", "fullName email")
      .lean();
    return ok({ request: hiringRequest, recommendations });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.hiringRequests.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "request id");
    const hiringRequest = await HiringRequest.findById(id);
    if (!hiringRequest) return fail("Hiring request not found.", 404);
    const body = await readJson(request);

    if (body.assignedTo !== undefined) {
      hiringRequest.assignedTo = toObjectId(body.assignedTo) || null;
      if (hiringRequest.assignedTo) hiringRequest.status = "assigned";
    }
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!HIRING_REQUEST_STATUSES.includes(status as never)) return fail("Invalid status.", 400);
      hiringRequest.status = status;
    }
    if (body.note !== undefined) {
      hiringRequest.history.push({ status: hiringRequest.status, note: cleanString(body.note, 1000), by: toObjectId(auth.session.userId)!, at: new Date() });
    }
    await hiringRequest.save();

    await logActivity({
      session: auth.session,
      action: "hiringRequest.counseling.updated",
      entity: "HiringRequest",
      entityId: id,
      description: `Counseling updated hiring request to ${hiringRequest.status}.`,
    });
    if (body.assignedTo) {
      await notify({
        userId: String(hiringRequest.assignedTo),
        type: "hiringRequest.assigned",
        title: "Hiring request assigned to you",
        message: `You have been assigned to source candidates for ${hiringRequest.jobTitle}.`,
        link: "/counseling/hiring-requests",
      });
    }
    return ok({ request: hiringRequest });
  } catch (error) {
    return handleError(error);
  }
}
