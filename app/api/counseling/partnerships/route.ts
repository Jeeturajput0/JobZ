import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, toObjectId, isObjectId, parsePagination } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import Partnership from "@/models/Partnership";
import Company from "@/models/Company";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.hiringRequests.view", "counseling.contact.companies", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { counselingTeamId: auth.session.counselingTeamId };
    if (sp.get("status")) query.status = sp.get("status");
    if (sp.get("direction")) query.initiatedBy = sp.get("direction");
    const search = sp.get("search")?.trim();
    let companyIds: string[] | undefined;
    if (search) {
      const companies = await Company.find({ name: { $regex: search, $options: "i" } }).select("_id").lean();
      companyIds = companies.map((c) => String(c._id));
      query.companyId = { $in: companyIds };
    }
    const [partnerships, total] = await Promise.all([
      Partnership.find(query)
        .populate({ path: "companyId", select: "name industry logo" })
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
    const auth = await requirePermission(request, ["counseling.contact.companies", "counseling.team.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    if (!auth.session.counselingTeamId) return fail("No counseling organization is linked to your account.", 403);
    const body = await readJson(request);
    if (!isObjectId(body.companyId)) return fail("A valid company is required.", 400);
    const company = await Company.findOne({ _id: body.companyId, status: "active", verificationStatus: "verified" });
    if (!company) return fail("Company not found or not eligible.", 404);
    const existing = await Partnership.findOne({
      companyId: body.companyId,
      counselingTeamId: auth.session.counselingTeamId,
    });
    if (existing) return fail("A partnership request already exists for this company.", 409);

    const partnership = await Partnership.create({
      companyId: toObjectId(body.companyId)!,
      counselingTeamId: toObjectId(auth.session.counselingTeamId)!,
      status: "pending",
      initiatedBy: "counseling",
      requestedBy: toObjectId(auth.session.userId),
      notes: cleanString(body.message, 3000),
      history: [{ status: "pending", note: "Partnership request sent by counseling organization", by: toObjectId(auth.session.userId), at: new Date() }],
    });
    await logActivity({
      session: auth.session,
      action: "partnership.request.sent",
      entity: "Partnership",
      entityId: String(partnership._id),
      description: `Sent a partnership request to ${company.name}.`,
    });
    // Notify the company owner through the real account relationship.
    const owner = await User.findById(company.ownerId).select("_id").lean();
    if (owner) {
      await notify({
        userId: String(owner._id),
        type: "partnership.request.received",
        title: "Partnership request received",
        message: `A counseling organization requested a partnership with ${company.name}.`,
        link: "/company/dashboard",
      });
    }
    return created({ partnership });
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
    if (!isObjectId(body.partnershipId)) return fail("A valid partnership is required.", 400);
    const partnership = await Partnership.findOne({
      _id: body.partnershipId,
      counselingTeamId: auth.session.counselingTeamId,
    });
    if (!partnership) return fail("Partnership not found.", 404);
    if (partnership.status !== "pending") return fail("Only pending requests can be accepted or rejected.", 409);
    const status = String(body.status);
    if (!["accepted", "rejected"].includes(status)) return fail("Invalid status. Use accepted or rejected.", 400);

    partnership.status = status as "accepted" | "rejected";
    partnership.reviewedBy = toObjectId(auth.session.userId);
    partnership.reviewedAt = new Date();
    partnership.history.push({ status, note: cleanString(body.note, 1000), by: toObjectId(auth.session.userId), at: new Date() });
    await partnership.save();

    const company = await Company.findById(partnership.companyId).select("name ownerId").lean();
    const recipients: string[] = [];
    if (company?.ownerId) recipients.push(String(company.ownerId));
    if (partnership.requestedBy) recipients.push(String(partnership.requestedBy));
    await notify({
      userId: Array.from(new Set(recipients)),
      type: status === "accepted" ? "partnership.accepted" : "partnership.rejected",
      title: `Partnership ${status}`,
      message: `A partnership request with ${company?.name || "your organization"} was ${status}.`,
      link: "/counseling/partnerships",
    });
    await logActivity({
      session: auth.session,
      action: status === "accepted" ? "partnership.accepted" : "partnership.rejected",
      entity: "Partnership",
      entityId: String(partnership._id),
      description: `${status === "accepted" ? "Accepted" : "Rejected"} a partnership request.`,
    });
    return ok({ partnership });
  } catch (error) {
    return handleError(error);
  }
}
