import { NextRequest } from "next/server";
import { getSession, forbidden, unauthorized } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { getCompanyCandidateIds } from "@/lib/company";
import { evaluateAndStoreAts } from "@/lib/ats-store";
import { logActivity } from "@/lib/notify";
import Application from "@/models/Application";
import AtsEvaluation from "@/models/AtsEvaluation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession(request);
    if (!session) return unauthorized();
    const id = requireObjectId((await ctx.params).id, "application id");
    const application = await Application.findById(id).lean();
    if (!application) return fail("Application not found.", 404);

    const candidateId = String(application.jobSeekerId);
    let allowed = candidateId === session.userId || session.role === "admin";
    if (!allowed && ["employer", "companyMember"].includes(session.role) && session.companyId) {
      const accessible = await getCompanyCandidateIds(session.companyId);
      allowed = accessible.includes(candidateId) && hasPermission(session.permissions, "company.ats.view");
    }
    if (!allowed && ["counselingAdmin", "counselingMember"].includes(session.role)) {
      allowed = hasPermission(session.permissions, "counseling.assessments.viewResults");
    }
    if (!allowed) return forbidden("You are not authorised to view this ATS evaluation.");

    const evaluations = await AtsEvaluation.find({ applicationId: id }).sort({ createdAt: -1 }).lean();
    return ok({ evaluations });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession(request);
    if (!session) return unauthorized();
    const id = requireObjectId((await ctx.params).id, "application id");
    const application = await Application.findById(id);
    if (!application) return fail("Application not found.", 404);

    const companyAllowed = ["employer", "companyMember"].includes(session.role) && session.companyId &&
      String(application.companyId || "") === session.companyId && hasPermission(session.permissions, "company.ats.view");
    const adminAllowed = session.role === "admin" || (["counselingAdmin", "counselingMember"].includes(session.role) && hasPermission(session.permissions, "counseling.assessments.manage"));
    if (!companyAllowed && !adminAllowed) return forbidden();

    const evaluation = await evaluateAndStoreAts({
      applicationId: id,
      jobId: String(application.jobId),
      candidateId: String(application.jobSeekerId),
      companyId: application.companyId ? String(application.companyId) : null,
      evaluatedBy: session.userId,
    });
    if (!evaluation) return fail("Job not found.", 404);
    await logActivity({ session, action: "ats.reevaluated", entity: "AtsEvaluation", entityId: String(evaluation._id), description: "Re-ran ATS evaluation." });
    return ok({ evaluation });
  } catch (error) {
    return handleError(error);
  }
}
