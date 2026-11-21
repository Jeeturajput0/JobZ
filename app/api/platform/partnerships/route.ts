import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, created, fail, handleError, readJson, parsePagination, cleanString, isObjectId, toObjectId } from "@/lib/api";
import { logActivity } from "@/lib/notify";
import Partnership from "@/models/Partnership";
import Company from "@/models/Company";
import CounselingTeam from "@/models/CounselingTeam";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = {};
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("companyId")) query.companyId = sp.get("companyId");
    if (sp.get("counselingTeamId")) query.counselingTeamId = sp.get("counselingTeamId");
    const search = sp.get("search")?.trim();
    if (search) {
      const [companies, teams] = await Promise.all([
        Company.find({ name: { $regex: search, $options: "i" } }).select("_id").lean(),
        CounselingTeam.find({ name: { $regex: search, $options: "i" } }).select("_id").lean(),
      ]);
      query.$or = [
        { companyId: { $in: companies.map((c) => c._id) } },
        { counselingTeamId: { $in: teams.map((t) => t._id) } },
      ];
    }
    const [partnerships, total] = await Promise.all([
      Partnership.find(query)
        .populate({ path: "companyId", select: "name industry verificationStatus" })
        .populate({ path: "counselingTeamId", select: "name status" })
        .populate({ path: "requestedBy", select: "fullName" })
        .populate({ path: "reviewedBy", select: "fullName" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Partnership.countDocuments(query),
    ]);
    return ok({ partnerships, total, page, limit });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.companies.manage"]);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    if (!isObjectId(body.companyId) || !isObjectId(body.counselingTeamId)) {
      return fail("A valid company and counseling organization are required.", 400);
    }
    const [company, team] = await Promise.all([
      Company.findById(body.companyId), CounselingTeam.findById(body.counselingTeamId),
    ]);
    if (!company || !team) return fail("Company or counseling organization not found.", 404);
    const exists = await Partnership.findOne({ companyId: body.companyId, counselingTeamId: body.counselingTeamId });
    if (exists) return fail("A partnership already exists for this company and organization.", 409);

    const partnership = await Partnership.create({
      companyId: toObjectId(body.companyId)!,
      counselingTeamId: toObjectId(body.counselingTeamId)!,
      status: "pending",
      initiatedBy: "platform",
      requestedBy: toObjectId(auth.session.userId),
      notes: cleanString(body.notes, 3000),
      history: [{ status: "pending", note: "Partnership created", by: toObjectId(auth.session.userId), at: new Date() }],
    });
    await logActivity({
      session: auth.session,
      action: "partnership.created",
      entity: "Partnership",
      entityId: String(partnership._id),
      description: `Created partnership between ${company.name} and ${team.name}.`,
    });
    return created({ partnership });
  } catch (error) {
    return handleError(error);
  }
}
