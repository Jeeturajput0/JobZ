import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import Placement from "@/models/Placement";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["platform.analytics.view"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "placement id");
    const placement = await Placement.findById(id)
      .populate({ path: "candidateId", select: "fullName email phone" })
      .populate({ path: "jobId", select: "title location jobType" })
      .populate({ path: "companyId", select: "name industry" })
      .populate({ path: "counselingTeamId", select: "name" })
      .populate({ path: "counselorId", select: "fullName email" })
      .populate({ path: "recordedBy", select: "fullName" }).lean();
    if (!placement) return fail("Placement record not found.", 404);
    return ok({ placement });
  } catch (error) {
    return handleError(error);
  }
}
