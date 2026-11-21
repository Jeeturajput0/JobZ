import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import { resolveCompanyId, getCompanyCandidateIds } from "@/lib/company";
import { buildCandidateView } from "@/lib/candidate-view";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.candidates.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ candidates: [], total: 0 });

    let candidateIds = await getCompanyCandidateIds(companyId);
    const sp = request.nextUrl.searchParams;
    const search = sp.get("search")?.trim().toLowerCase();
    const skill = sp.get("skill")?.trim().toLowerCase();
    const { page, limit, skip } = parsePagination(sp, 20);

    if (search || skill) {
      const query: Record<string, unknown> = { _id: { $in: candidateIds } };
      if (search) query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
      if (skill) {
        const matches = await JobSeekerProfile.find({ skills: { $regex: skill, $options: "i" } }).select("userId").lean();
        query._id = { $in: candidateIds.filter((id) => matches.some((m) => String(m.userId) === id)) };
      }
      candidateIds = (await User.find(query).select("_id").lean()).map((u) => String(u._id));
    }

    const pageIds = candidateIds.slice(skip, skip + limit);
    const candidates = [];
    for (const id of pageIds) {
      const view = await buildCandidateView(id, auth.session, "company");
      if (view) candidates.push(view);
    }
    return ok({ candidates, total: candidateIds.length, page, limit });
  } catch (error) {
    return handleError(error);
  }
}
