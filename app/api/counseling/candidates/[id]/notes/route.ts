import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, toObjectId, requireObjectId } from "@/lib/api";
import { getAccessibleCounselingCandidateIds, ensureCounselingRecord } from "@/lib/counseling";

interface Ctx { params: Promise<{ id: string }> }

function canReadNotes(role: string, permissions: string[]): boolean {
  return role === "admin" || permissions.includes("counseling.notes.manage") || permissions.includes("counseling.team.manage");
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.candidates.view", "counseling.candidates.viewAll"]);
    if (!auth.authorized) return auth.response;
    if (!canReadNotes(auth.session.role, auth.session.permissions)) {
      return fail("You are not authorised to view counseling notes.", 403);
    }
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const candidateId = requireObjectId((await ctx.params).id, "candidate id");
    const allowed = await getAccessibleCounselingCandidateIds(auth.session);
    if (allowed !== null && !allowed.includes(candidateId)) return fail("This candidate is not assigned to you.", 403);
    if (!auth.session.counselingTeamId) return fail("No counseling team is linked to your account.", 403);

    const record = await ensureCounselingRecord(auth.session.counselingTeamId, candidateId);
    const notes = (record.notes || []).filter((n) => !n.isPrivate || String(n.authorId) === auth.session.userId);
    return ok({ notes });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.notes.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const candidateId = requireObjectId((await ctx.params).id, "candidate id");
    const allowed = await getAccessibleCounselingCandidateIds(auth.session);
    if (allowed !== null && !allowed.includes(candidateId)) return fail("This candidate is not assigned to you.", 403);
    if (!auth.session.counselingTeamId) return fail("No counseling team is linked to your account.", 403);

    const body = await readJson(request);
    const note = cleanString(body.note, 5000);
    if (!note) return fail("Note is required.", 400);
    const record = await ensureCounselingRecord(auth.session.counselingTeamId, candidateId);
    record.notes.push({
      authorId: toObjectId(auth.session.userId)!,
      note,
      isPrivate: body.isPrivate !== false,
      at: new Date(),
    });
    await record.save();
    return created({ note: record.notes[record.notes.length - 1] });
  } catch (error) {
    return handleError(error);
  }
}
