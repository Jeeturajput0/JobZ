import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString } from "@/lib/api";
import CounselingTeam from "@/models/CounselingTeam";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.dashboard.view", "counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const team = await CounselingTeam.findById(auth.session.counselingTeamId).populate("adminId", "fullName email").lean();
    return ok({ team });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const body = await readJson(request);
    const team = await CounselingTeam.findById(auth.session.counselingTeamId);
    if (!team) return fail("Team not found.", 404);
    for (const field of ["name", "description"] as const) {
      if (body[field] !== undefined) (team as unknown as Record<string, unknown>)[field] = cleanString(body[field], 2000);
    }
    await team.save();
    return ok({ team });
  } catch (error) {
    return handleError(error);
  }
}
