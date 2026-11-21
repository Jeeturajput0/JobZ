import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import CounselingTeam from "@/models/CounselingTeam";
import CounselingMembership from "@/models/CounselingMembership";
import Partnership from "@/models/Partnership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.partnerships.manage", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { status: "active" };
    const search = sp.get("search")?.trim();
    if (search) query.name = { $regex: search, $options: "i" };
    const [teams, total] = await Promise.all([
      CounselingTeam.find(query).select("name slug description status").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CounselingTeam.countDocuments(query),
    ]);
    const ids = teams.map((t) => t._id);
    const [memberships, partnerships] = await Promise.all([
      CounselingMembership.aggregate([{ $match: { teamId: { $in: ids }, status: "active" } }, { $group: { _id: "$teamId", count: { $sum: 1 } } }]),
      Partnership.find({ companyId, counselingTeamId: { $in: ids } }).select("counselingTeamId status").lean(),
    ]);
    const memberMap = new Map(memberships.map((m) => [String(m._id), m.count]));
    const partnerMap = new Map(partnerships.map((p) => [String(p.counselingTeamId), p.status]));
    return ok({
      organizations: teams.map((t) => ({
        ...t,
        teamMembers: memberMap.get(String(t._id)) || 0,
        partnershipStatus: partnerMap.get(String(t._id)) || "none",
      })),
      total, page, limit,
    });
  } catch (error) {
    return handleError(error);
  }
}
