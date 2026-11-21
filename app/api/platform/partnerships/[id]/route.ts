import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId, toObjectId } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import Partnership from "@/models/Partnership";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import HiringRequest from "@/models/HiringRequest";
import Placement from "@/models/Placement";
import ActivityLog from "@/models/ActivityLog";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "partnership id");
    const partnership = await Partnership.findById(id)
      .populate({ path: "companyId", select: "name industry" })
      .populate({ path: "counselingTeamId", select: "name" })
      .populate({ path: "requestedBy", select: "fullName" })
      .populate({ path: "reviewedBy", select: "fullName" }).lean();
    if (!partnership) return fail("Partnership not found.", 404);

    const [recommendations, hiringRequests, placements, activity] = await Promise.all([
      CandidateRecommendation.find({
        companyId: partnership.companyId,
        counselingTeamId: partnership.counselingTeamId,
      }).populate({ path: "candidateId", select: "fullName" }).sort({ createdAt: -1 }).lean(),
      HiringRequest.find({ companyId: partnership.companyId }).sort({ createdAt: -1 }).limit(30).lean(),
      Placement.find({ companyId: partnership.companyId, counselingTeamId: partnership.counselingTeamId }).lean(),
      ActivityLog.find({ entity: "Partnership", entityId: id }).sort({ createdAt: -1 }).lean(),
    ]);
    return ok({ partnership, recommendations, hiringRequests, placements, activity });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "partnership id");
    const partnership = await Partnership.findById(id);
    if (!partnership) return fail("Partnership not found.", 404);
    const body = await readJson(request);
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!["pending", "accepted", "rejected", "suspended", "terminated"].includes(status)) {
        return fail("Invalid partnership status.", 400);
      }
      partnership.status = status as typeof partnership.status;
      partnership.reviewedBy = toObjectId(auth.session.userId);
      partnership.reviewedAt = new Date();
      partnership.history.push({
        status,
        note: cleanString(body.note, 1000),
        by: toObjectId(auth.session.userId),
        at: new Date(),
      });
    }
    if (body.notes !== undefined) partnership.notes = cleanString(body.notes, 3000);
    await partnership.save();
    await logActivity({
      session: auth.session,
      action: "partnership.status.updated",
      entity: "Partnership",
      entityId: id,
      description: `Partnership status set to ${partnership.status}.`,
    });
    return ok({ partnership });
  } catch (error) {
    return handleError(error);
  }
}
