import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import CounselingTeam from "@/models/CounselingTeam";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.dashboard.view", "counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const team = await CounselingTeam.findById(auth.session.counselingTeamId || "").populate("adminId", "fullName email").lean();
    if (!team) return fail("Organization not found.", 404);
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
    const team = await CounselingTeam.findById(auth.session.counselingTeamId || "");
    if (!team) return fail("Organization not found.", 404);
    const body = await readJson(request);
    if (body.name !== undefined) {
      const name = cleanString(body.name, 150);
      if (name.length < 2) return fail("Organization name must be at least 2 characters.", 400);
      team.name = name;
    }
    if (body.description !== undefined) team.description = cleanString(body.description, 5000);

    const allowedSettingKeys = ["address", "contactEmail", "contactPhone", "website", "logo", "teamPreferences", "notificationPreferences"];
    const settings = { ...(team.settings || {}) } as Record<string, unknown>;
    for (const key of allowedSettingKeys) {
      if (body[key] !== undefined) settings[key] = cleanString(body[key], 2000);
    }
    team.settings = settings;
    await team.save();
    await logActivity({
      session: auth.session,
      action: "counselingTeam.settings.updated",
      entity: "CounselingTeam",
      entityId: String(team._id),
      description: "Updated counseling organization settings.",
    });
    return ok({ team });
  } catch (error) {
    return handleError(error);
  }
}
