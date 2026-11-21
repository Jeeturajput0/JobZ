import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { resolveCompanyId, getCompanyCandidateIds } from "@/lib/company";
import { buildCandidateView } from "@/lib/candidate-view";
import Application from "@/models/Application";
import CandidateRecommendation from "@/models/CandidateRecommendation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["company.candidates.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const candidateId = requireObjectId((await ctx.params).id, "candidate id");
    if (!companyId) return fail("No company is linked to your account.", 403);

    const allowedIds = await getCompanyCandidateIds(companyId);
    if (!allowedIds.includes(candidateId)) {
      return fail("You can only view candidates who applied to your jobs or were recommended to you.", 403);
    }
    const view = await buildCandidateView(candidateId, auth.session, "company");
    if (!view) return fail("Candidate not found.", 404);

    const [applications, recommendations] = await Promise.all([
      Application.find({ jobSeekerId: candidateId }).select("jobId status appliedAt").populate("jobId", "title").lean(),
      CandidateRecommendation.find({ candidateId, companyId }).select("jobId status matchScore note").populate("jobId", "title").lean(),
    ]);
    return ok({ candidate: view, applications, recommendations });
  } catch (error) {
    return handleError(error);
  }
}
