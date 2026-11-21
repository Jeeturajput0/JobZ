import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId } from "@/lib/api";
import { VERIFICATION_CATEGORIES } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import VerificationRequest from "@/models/VerificationRequest";
import CandidateDocument from "@/models/CandidateDocument";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const requests = await VerificationRequest.find({ candidateId: auth.session.userId })
      .populate({ path: "documents", select: "name type mimeType size category" })
      .sort({ createdAt: -1 })
      .lean();
    return ok({ requests });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    const category = String(body.category);
    if (!VERIFICATION_CATEGORIES.includes(category as never)) return fail("Invalid verification category.", 400);
    const documentIds = cleanStringArray(body.documents, 20, 24);
    const owned = documentIds.length
      ? await CandidateDocument.find({ _id: { $in: documentIds }, candidateId: auth.session.userId }).select("_id").lean()
      : [];
    if (owned.length !== documentIds.length) return fail("One or more documents are invalid.", 403);

    const existing = await VerificationRequest.findOne({ candidateId: auth.session.userId, category, status: { $in: ["pendingReview", "underReview"] } });
    if (existing) return fail("A verification request is already in progress for this category.", 409);

    const verification = await VerificationRequest.create({
      candidateId: toObjectId(auth.session.userId)!,
      category,
      status: "pendingReview",
      documents: owned.map((d) => d._id),
      note: cleanString(body.note, 2000),
      history: [{ status: "pendingReview", at: new Date() }],
    });
    await JobSeekerProfile.findOneAndUpdate(
      { userId: auth.session.userId },
      { $set: { verificationStatus: "pendingReview" } },
    );
    await logActivity({ session: auth.session, action: "verification.submitted", entity: "VerificationRequest", entityId: String(verification._id), description: `Submitted ${category} verification.` });

    const reviewers = await User.find({ role: "counselingAdmin", status: "active" }).select("_id").lean();
    await notify({
      userId: reviewers.map((r) => String(r._id)),
      type: "verification.submitted",
      title: "New verification request",
      message: `A candidate submitted ${category} verification documents.`,
      link: "/counseling/verification",
    });
    return created({ verification });
  } catch (error) {
    return handleError(error);
  }
}
