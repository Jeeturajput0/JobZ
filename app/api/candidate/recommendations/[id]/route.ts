import { NextRequest } from "next/server";
import { requireJobSeeker } from "@/lib/session";
import { ok, fail, handleError, readJson, requireObjectId, toObjectId } from "@/lib/api";
import { logActivity, notify } from "@/lib/notify";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Company from "@/models/Company";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requireJobSeeker(request);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "recommendation id");
    const recommendation = await CandidateRecommendation.findOne({ _id: id, candidateId: auth.session.userId });
    if (!recommendation) return fail("Recommendation not found.", 404);
    if (recommendation.candidateConsent !== "pending") return fail("You already responded to this recommendation.", 409);
    const body = await readJson(request);
    const decision = String(body.decision);
    if (!["accepted", "declined"].includes(decision)) return fail("Invalid decision.", 400);

    recommendation.candidateConsent = decision as "accepted" | "declined";
    if (decision === "declined") {
      recommendation.status = "candidateDeclined";
      recommendation.timeline.push({ status: "candidateDeclined", note: "Candidate declined", by: toObjectId(auth.session.userId)!, at: new Date() });
      await recommendation.save();
      await notify({ userId: String(recommendation.counselorId), type: "recommendation.declined", title: "Candidate declined a recommendation", message: "A candidate declined a recommendation.", link: "/counseling/recommendations" });
      return ok({ recommendation });
    }

    recommendation.status = "sentToCompany";
    recommendation.timeline.push({ status: "candidateAccepted", note: "Candidate consented to share profile", by: toObjectId(auth.session.userId)!, at: new Date() });
    recommendation.timeline.push({ status: "sentToCompany", note: "Shared with company", by: toObjectId(auth.session.userId)!, at: new Date() });
    await recommendation.save();

    let application = null;
    if (body.apply === true && recommendation.jobId) {
      const job = await Job.findById(recommendation.jobId);
      if (job) {
        application = await Application.findOneAndUpdate(
          { jobId: job._id, jobSeekerId: auth.session.userId },
          {
            $setOnInsert: {
              jobId: job._id,
              jobSeekerId: toObjectId(auth.session.userId)!,
              employerId: job.employerId,
              companyId: recommendation.companyId,
              recommendationId: recommendation._id,
              source: "recommendation",
              status: "applied",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      }
    }

    const company = await Company.findById(recommendation.companyId).select("ownerId").lean();
    const recipients = [String(recommendation.counselorId)];
    if (company?.ownerId) recipients.push(String(company.ownerId));
    await notify({
      userId: Array.from(new Set(recipients)),
      type: "recommendation.accepted",
      title: "Candidate accepted a recommendation",
      message: "The candidate consented to share their profile with your company.",
      link: "/company/recommendations",
    });
    await logActivity({ session: auth.session, action: "recommendation.consent", entity: "CandidateRecommendation", entityId: id, description: "Candidate accepted a recommendation." });
    return ok({ recommendation, application });
  } catch (error) {
    return handleError(error);
  }
}
