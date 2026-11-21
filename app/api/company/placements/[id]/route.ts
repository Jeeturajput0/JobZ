import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import Placement from "@/models/Placement";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.placements.manage", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const id = requireObjectId((await ctx.params).id, "placement id");
    const placement = await Placement.findOne({ _id: id, companyId })
      .populate({ path: "candidateId", select: "fullName email" })
      .populate({ path: "jobId", select: "title location" })
      .populate({ path: "counselingTeamId", select: "name" })
      .populate({ path: "counselorId", select: "fullName" })
      .lean();
    if (!placement) return fail("Placement record not found for your company.", 404);
    return ok({ placement });
  } catch (error) {
    return handleError(error);
  }
}
