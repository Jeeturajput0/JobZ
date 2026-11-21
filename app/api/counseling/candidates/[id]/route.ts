import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { getAccessibleCounselingCandidateIds, ensureCounselingRecord } from "@/lib/counseling";
import { buildCandidateView } from "@/lib/candidate-view";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { getCompletionWeights } from "@/lib/settings";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import User from "@/models/User";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.candidates.view", "counseling.candidates.viewAll"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const candidateId = requireObjectId((await ctx.params).id, "candidate id");
    const allowed = await getAccessibleCounselingCandidateIds(auth.session);
    if (allowed !== null && !allowed.includes(candidateId)) {
      return fail("This candidate is not assigned to you.", 403);
    }

    const view = await buildCandidateView(candidateId, auth.session, "counseling");
    if (!view) return fail("Candidate not found.", 404);

    const weights = await getCompletionWeights();
    const [profile, user] = await Promise.all([
      JobSeekerProfile.findOne({ userId: candidateId }).lean(),
      User.findById(candidateId).select("fullName phone").lean(),
    ]);
    const completion = calculateProfileCompletion(profile, user, weights);

    const record = auth.session.counselingTeamId
      ? await ensureCounselingRecord(auth.session.counselingTeamId, candidateId)
      : null;

    return ok({ candidate: { ...view, profileCompletion: completion.percentage }, completion, record });
  } catch (error) {
    return handleError(error);
  }
}
