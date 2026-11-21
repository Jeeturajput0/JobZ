import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, requireObjectId } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import CounselingTeam from "@/models/CounselingTeam";
import CounselingMembership from "@/models/CounselingMembership";
import CounselingRecord from "@/models/CounselingRecord";
import Partnership from "@/models/Partnership";
import Placement from "@/models/Placement";
import HiringRequest from "@/models/HiringRequest";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import ActivityLog from "@/models/ActivityLog";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "organization id");
    const team = await CounselingTeam.findById(id)
      .populate({ path: "adminId", select: "fullName email phone status" }).lean();
    if (!team) return fail("Counseling organization not found.", 404);

    const [members, candidates, partnerships, placements, hiringRequests, recommendations, activity] = await Promise.all([
      CounselingMembership.find({ teamId: id }).populate({ path: "userId", select: "fullName email status" }).lean(),
      CounselingRecord.find({ teamId: id }).populate({ path: "candidateId", select: "fullName email" }).sort({ createdAt: -1 }).limit(50).lean(),
      Partnership.find({ counselingTeamId: id }).populate({ path: "companyId", select: "name" }).sort({ createdAt: -1 }).lean(),
      Placement.find({ counselingTeamId: id }).populate({ path: "candidateId", select: "fullName" }).sort({ createdAt: -1 }).lean(),
      HiringRequest.find({}).sort({ createdAt: -1 }).limit(30).lean(),
      CandidateRecommendation.find({ counselingTeamId: id }).populate({ path: "candidateId", select: "fullName" }).sort({ createdAt: -1 }).limit(50).lean(),
      ActivityLog.find({ counselingTeamId: id }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);
    return ok({ team, members, candidates, partnerships, placements, hiringRequests, recommendations, activity });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "organization id");
    const team = await CounselingTeam.findById(id);
    if (!team) return fail("Counseling organization not found.", 404);
    const body = await readJson(request);
    if (body.name !== undefined) team.name = cleanString(body.name, 150) || team.name;
    if (body.description !== undefined) team.description = cleanString(body.description, 5000);
    if (body.status !== undefined && ["active", "suspended"].includes(String(body.status))) {
      team.status = String(body.status) as "active" | "suspended";
    }
    await team.save();
    await logActivity({
      session: auth.session,
      action: "counselingTeam.updated",
      entity: "CounselingTeam",
      entityId: id,
      description: `Updated counseling organization ${team.name}.`,
    });
    return ok({ team });
  } catch (error) {
    return handleError(error);
  }
}
