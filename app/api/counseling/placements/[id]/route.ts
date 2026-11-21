import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, toObjectId } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import Placement from "@/models/Placement";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.recommendations.manage", "counseling.analytics.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "placement id");
    const placement = await Placement.findOne({ _id: id, counselingTeamId: auth.session.counselingTeamId })
      .populate({ path: "candidateId", select: "fullName email" })
      .populate({ path: "jobId", select: "title location" })
      .populate({ path: "companyId", select: "name industry" })
      .populate({ path: "counselorId", select: "fullName" })
      .populate({ path: "recordedBy", select: "fullName" }).lean();
    if (!placement) return fail("Placement record not found.", 404);
    return ok({ placement });
  } catch (error) {
    return handleError(error);
  }
}

/** Records joining confirmation. Never marks a candidate placed without a confirmed date. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage", "counseling.recommendations.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "placement id");
    const placement = await Placement.findOne({ _id: id, counselingTeamId: auth.session.counselingTeamId });
    if (!placement) return fail("Placement record not found.", 404);
    const body = await readJson(request);
    if (body.joiningDate === undefined) return fail("A joining date is required to confirm a placement.", 400);
    const joiningDate = new Date(String(body.joiningDate));
    if (Number.isNaN(joiningDate.getTime())) return fail("Invalid joining date.", 400);
    placement.status = "confirmed";
    placement.joiningDate = joiningDate;
    placement.history.push({
      status: "confirmed",
      note: cleanString(body.note, 1000) || "Joining confirmed by counseling organization",
      by: toObjectId(auth.session.userId),
      at: new Date(),
    });
    await placement.save();
    await logActivity({
      session: auth.session,
      action: "placement.joining.confirmed",
      entity: "Placement",
      entityId: id,
      description: "Confirmed a candidate's joining date.",
    });
    await notify({
      userId: String(placement.candidateId),
      type: "placement.confirmed",
      title: "Placement confirmed",
      message: "Your joining has been recorded by your counseling organization.",
      link: "/profile",
    });
    return ok({ placement });
  } catch (error) {
    return handleError(error);
  }
}
