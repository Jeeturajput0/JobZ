import { NextRequest, NextResponse } from "next/server";
import { getSession, forbidden, unauthorized } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/notify";
import CandidateDocument from "@/models/CandidateDocument";
import VerificationRequest from "@/models/VerificationRequest";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import { getCompanyCandidateIds } from "@/lib/company";
import { getAccessibleCounselingCandidateIds } from "@/lib/counseling";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession(request);
    if (!session) return unauthorized();
    const id = requireObjectId((await ctx.params).id, "document id");
    const document = await CandidateDocument.findById(id);
    if (!document) return fail("Document not found.", 404);
    const candidateId = String(document.candidateId);

    let allowed = candidateId === session.userId || session.role === "admin";

    if (!allowed && ["employer", "companyMember"].includes(session.role)) {
      if (session.companyId) {
        const candidateIds = await getCompanyCandidateIds(session.companyId);
        allowed = candidateIds.includes(candidateId);
        if (allowed && document.type === "identity") {
          allowed = hasPermission(session.permissions, "company.candidates.documents.view");
        } else if (allowed) {
          allowed = hasPermission(session.permissions, "company.candidates.resume.download") ||
            (document.type === "resume" && hasPermission(session.permissions, "company.candidates.resume.view"));
        }
      }
    }

    if (!allowed && ["counselingAdmin", "counselingMember"].includes(session.role)) {
      const accessible = await getAccessibleCounselingCandidateIds(session);
      allowed = (accessible === null || accessible.includes(candidateId)) &&
        hasPermission(session.permissions, "counseling.documents.review");
    }

    if (!allowed) return forbidden("You are not authorised to access this document.");

    await logActivity({
      session,
      action: "document.accessed",
      entity: "CandidateDocument",
      entityId: id,
      description: `Accessed ${document.type} document for candidate ${candidateId}.`,
    });
    return NextResponse.json(
      { success: true, document: { id: document._id, name: document.name, type: document.type, mimeType: document.mimeType, size: document.size, dataUrl: document.dataUrl } },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession(request);
    if (!session) return unauthorized();
    const id = requireObjectId((await ctx.params).id, "document id");
    const document = await CandidateDocument.findOne({ _id: id, candidateId: session.userId });
    if (!document) return fail("Document not found.", 404);
    await VerificationRequest.updateMany({ documents: document._id }, { $pull: { documents: document._id } });
    await JobSeekerProfile.findOneAndUpdate(
      { userId: session.userId, preferredResumeId: document._id },
      { $set: { preferredResumeId: null, resumeUrl: "" } },
    );
    await document.deleteOne();
    return ok({ message: "Document deleted." });
  } catch (error) {
    return handleError(error);
  }
}
