import { NextRequest } from "next/server";
import { requirePermission, assertCompanyScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, toObjectId, isObjectId, parsePagination } from "@/lib/api";
import { resolveCompanyId } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import Partnership from "@/models/Partnership";
import CounselingTeam from "@/models/CounselingTeam";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.partnerships.manage", "company.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return ok({ partnerships: [], total: 0 });
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { companyId };
    if (sp.get("status")) query.status = sp.get("status");
    const search = sp.get("search")?.trim();
    if (search) {
      const teams = await CounselingTeam.find({ name: { $regex: search, $options: "i" } }).select("_id").lean();
      query.counselingTeamId = { $in: teams.map((t) => t._id) };
    }
    const [partnerships, total] = await Promise.all([
      Partnership.find(query)
        .populate({ path: "counselingTeamId", select: "name description" })
        .populate({ path: "requestedBy", select: "fullName" })
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
    const auth = await requirePermission(request, ["company.partnerships.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    if (!companyId) return fail("No company is linked to your account.", 403);
    const body = await readJson(request);
    if (!isObjectId(body.counselingTeamId)) return fail("A valid counseling organization is required.", 400);
    const team = await CounselingTeam.findOne({ _id: body.counselingTeamId, status: "active" });
    if (!team) return fail("Counseling organization not found or inactive.", 404);
    const existing = await Partnership.findOne({ companyId, counselingTeamId: body.counselingTeamId });
    if (existing) return fail("A partnership request already exists for this organization.", 409);

    const partnership = await Partnership.create({
      companyId: toObjectId(companyId)!,
      counselingTeamId: toObjectId(body.counselingTeamId)!,
      status: "pending",
      initiatedBy: "company",
      requestedBy: toObjectId(auth.session.userId),
      notes: cleanString(body.message, 3000),
      history: [{ status: "pending", note: "Partnership request sent by company", by: toObjectId(auth.session.userId), at: new Date() }],
    });
    await logActivity({ session: auth.session, action: "partnership.request.sent", entity: "Partnership", entityId: String(partnership._id), description: `Sent partnership request to ${team.name}.` });
    if (team.adminId) {
      await notify({ userId: String(team.adminId), type: "partnership.request.received", title: "Partnership request received", message: "A company requested a partnership with your organization.", link: "/counseling/partnerships" });
    }
    return created({ partnership });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["company.partnerships.manage"]);
    if (!auth.authorized) return auth.response;
    const companyId = await resolveCompanyId(auth.session);
    const denial = assertCompanyScope(auth.session, companyId);
    if (denial) return denial;
    const body = await readJson(request);
    if (!isObjectId(body.partnershipId)) return fail("A valid partnership is required.", 400);
    const partnership = await Partnership.findOne({ _id: body.partnershipId, companyId });
    if (!partnership) return fail("Partnership not found for your company.", 404);
    const status = String(body.status);

    if (partnership.status === "pending" && partnership.initiatedBy === "counseling" && ["accepted", "rejected"].includes(status)) {
      partnership.status = status as "accepted" | "rejected";
      partnership.reviewedBy = toObjectId(auth.session.userId);
      partnership.reviewedAt = new Date();
    } else if (partnership.status === "pending" && partnership.initiatedBy === "company" && status === "cancelled") {
      partnership.status = "terminated";
    } else if (partnership.status === "accepted" && status === "terminated") {
      partnership.status = "terminated";
    } else if (partnership.status === "rejected" && status === "cancelled") {
      partnership.status = "terminated";
    } else {
      return fail("This partnership status transition is not allowed.", 409);
    }
    partnership.history.push({ status: partnership.status, note: cleanString(body.note, 1000), by: toObjectId(auth.session.userId), at: new Date() });
    await partnership.save();
    await logActivity({ session: auth.session, action: "partnership.status.updated", entity: "Partnership", entityId: String(partnership._id), description: `Partnership status set to ${partnership.status}.` });
    return ok({ partnership });
  } catch (error) {
    return handleError(error);
  }
}
