import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson, cleanString, toObjectId, requireObjectId } from "@/lib/api";
import { VERIFICATION_STATUSES } from "@/lib/constants";
import { logActivity, notify } from "@/lib/notify";
import VerificationRequest from "@/models/VerificationRequest";
import JobSeekerProfile from "@/models/JobSeekerProfile";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.documents.verify", "platform.verification.manage"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "verification request id");
    const verification = await VerificationRequest.findById(id);
    if (!verification) return fail("Verification request not found.", 404);
    const body = await readJson(request);
    const status = String(body.status);
    if (!VERIFICATION_STATUSES.includes(status as never)) return fail("Invalid status.", 400);

    verification.status = status;
    verification.reviewerId = toObjectId(auth.session.userId)!;
    verification.reviewedAt = new Date();
    verification.decisionNote = cleanString(body.note, 2000);
    if (body.requestedInfo !== undefined) verification.requestedInfo = cleanString(body.requestedInfo, 2000);
    verification.history.push({ status, note: verification.decisionNote, by: toObjectId(auth.session.userId)!, at: new Date() });
    await verification.save();

    if (status === "verified" || status === "rejected") {
      const profile = await JobSeekerProfile.findOne({ userId: verification.candidateId });
      if (profile) {
        if (status === "verified" && !profile.verifiedCategories.includes(verification.category)) {
          profile.verifiedCategories.push(verification.category);
        }
        if (status === "rejected") {
          profile.verifiedCategories = profile.verifiedCategories.filter((c) => c !== verification.category);
        }
        profile.verificationStatus = status;
        await profile.save();
      }
    }

    const messages: Record<string, string> = {
      verified: "Your documents were verified.",
      rejected: "Your verification request was rejected. You may resubmit.",
      additionalInfoRequired: "The reviewer requested additional information.",
      underReview: "Your verification request is under review.",
    };
    await notify({
      userId: String(verification.candidateId),
      type: "verification.status",
      title: "Verification status updated",
      message: messages[status] || `Your verification status is now ${status}.`,
      link: "/profile/edit",
    });
    await logActivity({
      session: auth.session,
      action: "verification.reviewed",
      entity: "VerificationRequest",
      entityId: id,
      description: `Reviewed ${verification.category} verification: ${status}.`,
    });
    return ok({ verification });
  } catch (error) {
    return handleError(error);
  }
}
