import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanStringArray, requireObjectId, toObjectId } from "@/lib/api";
import CandidateDocument from "@/models/CandidateDocument";
import VerificationRequest from "@/models/VerificationRequest";

interface Ctx { params: Promise<{ id: string }> }

/** Candidate resubmission after a rejection or an additional-info request. */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "verification request id");
    const verification = await VerificationRequest.findOne({ _id: id, candidateId: auth.session.userId });
    if (!verification) return fail("Verification request not found.", 404);
    if (!["rejected", "additionalInfoRequired"].includes(verification.status)) {
      return fail("This request cannot be resubmitted.", 409);
    }
    const body = await readJson(request);
    const documentIds = cleanStringArray(body.documents, 20, 24);
    if (documentIds.length) {
      const owned = await CandidateDocument.find({ _id: { $in: documentIds }, candidateId: auth.session.userId }).select("_id").lean();
      if (owned.length !== documentIds.length) return fail("One or more documents are invalid.", 403);
      verification.documents = owned.map((d) => d._id);
      await Promise.all(owned.map((d) => CandidateDocument.findByIdAndUpdate(d._id, { $set: { verificationId: verification._id } })));
    }
    verification.status = "pendingReview";
    verification.reviewerId = null;
    verification.reviewedAt = null;
    verification.history.push({ status: "pendingReview", note: "Resubmitted by candidate", by: toObjectId(auth.session.userId)!, at: new Date() });
    await verification.save();
    return ok({ verification });
  } catch (error) {
    return handleError(error);
  }
}
