import { NextRequest } from "next/server";
import { requirePermission, assertCounselingScope } from "@/lib/session";
import { ok, created, fail, handleError, readJson, cleanString, cleanStringArray, toObjectId, isObjectId } from "@/lib/api";
import { getAccessibleCounselingCandidateIds } from "@/lib/counseling";
import { hasPermission } from "@/lib/permissions";
import { ensureCompanyForOwner } from "@/lib/company";
import { logActivity, notify } from "@/lib/notify";
import CandidateRecommendation from "@/models/CandidateRecommendation";
import HiringRequest from "@/models/HiringRequest";
import Job from "@/models/Job";
import Company from "@/models/Company";
import Partnership from "@/models/Partnership";
import JobSeekerProfile from "@/models/JobSeekerProfile";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.recommendations.manage", "counseling.dashboard.view"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const status = request.nextUrl.searchParams.get("status");
    const query: Record<string, unknown> = { counselingTeamId: auth.session.counselingTeamId };
    if (!hasPermission(auth.session.permissions, "counseling.candidates.viewAll") && auth.session.role !== "admin") {
      query.counselorId = auth.session.userId;
    }
    if (status) query.status = status;
    const recommendations = await CandidateRecommendation.find(query)
      .populate({ path: "candidateId", select: "fullName email" })
      .populate({ path: "companyId", select: "name" })
      .populate({ path: "jobId", select: "title" })
      .populate({ path: "counselorId", select: "fullName" })
      .populate({ path: "hiringRequestId", select: "jobTitle" })
      .sort({ createdAt: -1 })
      .lean();
    return ok({ recommendations });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.recommendations.manage"]);
    if (!auth.authorized) return auth.response;
    const denial = assertCounselingScope(auth.session, auth.session.counselingTeamId);
    if (denial) return denial;
    const body = await readJson(request);
    const candidateId = cleanString(body.candidateId, 24);
    if (!isObjectId(candidateId)) return fail("A valid candidate is required.", 400);
    const allowed = await getAccessibleCounselingCandidateIds(auth.session);
    if (allowed !== null && !allowed.includes(candidateId)) return fail("This candidate is not assigned to you.", 403);

    // A partnered company can be selected directly; a job or hiring request
    // may refine the opportunity but is not mandatory.
    let companyId: string | null = isObjectId(body.companyId) ? body.companyId : null;
    let jobId: string | null = null;
    let hiringRequestId: string | null = null;
    if (isObjectId(body.hiringRequestId)) {
      const hr = await HiringRequest.findById(body.hiringRequestId);
      if (!hr) return fail("Hiring request not found.", 404);
      companyId = String(hr.companyId);
      hiringRequestId = String(hr._id);
    }
    if (isObjectId(body.jobId)) {
      const job = await Job.findById(body.jobId);
      if (!job) return fail("Job not found.", 404);
      jobId = String(job._id);
      if (!companyId) {
        const company = await ensureCompanyForOwner(String(job.employerId));
        companyId = String(company._id);
      }
    }
    if (!companyId) return fail("A company, hiring request or job is required.", 400);

    // Only an accepted partnership enables company-restricted recommendations.
    const partnership = await Partnership.findOne({
      companyId,
      counselingTeamId: auth.session.counselingTeamId,
      status: "accepted",
    }).select("_id");
    if (!partnership) return fail("An accepted partnership with this company is required before recommending candidates.", 403);

    const duplicate = await CandidateRecommendation.findOne({
      candidateId,
      companyId,
      counselingTeamId: auth.session.counselingTeamId,
      $or: [
        { jobId: jobId || null, hiringRequestId: hiringRequestId || null },
        { jobId: jobId || null },
        { hiringRequestId: hiringRequestId || null },
      ],
      status: { $nin: ["candidateDeclined", "rejected"] },
    }).select("_id");
    if (duplicate) return fail("This candidate has already been recommended for this opportunity.", 409);

    const candidateProfile = await JobSeekerProfile.findOne({ userId: candidateId }).select("consentShareWithCompanies").lean();
    const consentRequired = body.consentRequired !== false || !candidateProfile?.consentShareWithCompanies;
    const status = consentRequired ? "candidateApprovalPending" : "sentToCompany";
    const recommendation = await CandidateRecommendation.create({
      candidateId: toObjectId(candidateId)!,
      jobId: jobId ? toObjectId(jobId) : null,
      hiringRequestId: hiringRequestId ? toObjectId(hiringRequestId) : null,
      companyId: toObjectId(companyId)!,
      counselorId: toObjectId(auth.session.userId)!,
      counselingTeamId: auth.session.counselingTeamId ? toObjectId(auth.session.counselingTeamId) : null,
      status,
      matchScore: Number(body.matchScore) || 0,
      consentRequired,
      candidateConsent: consentRequired ? "pending" : "accepted",
      sharedFields: cleanStringArray(body.sharedFields, 30, 60).length
        ? cleanStringArray(body.sharedFields, 30, 60)
        : ["fullName", "headline", "summary", "skills", "education", "experience", "resumeUrl"],
      note: cleanString(body.note, 3000),
      timeline: [{ status, note: "Recommendation created", by: toObjectId(auth.session.userId)!, at: new Date() }],
    });

    const company = await Company.findById(companyId).select("ownerId").lean();
    const recipients: string[] = [];
    if (company?.ownerId) recipients.push(String(company.ownerId));
    if (jobId) {
      const job = await Job.findById(jobId).select("employerId").lean();
      if (job?.employerId) recipients.push(String(job.employerId));
    }
    if (consentRequired) {
      await notify({
        userId: candidateId,
        type: "recommendation.consentRequested",
        title: "A counselor recommended you for a role",
        message: "Review the opportunity and choose whether to share your profile with the company.",
        link: "/profile/counseling",
      });
    } else {
      await notify({
        userId: Array.from(new Set(recipients)),
        type: "recommendation.received",
        title: "New candidate recommendation",
        message: "A counseling team has recommended a candidate to your company.",
        link: "/company/recommendations",
      });
    }

    await logActivity({
      session: auth.session,
      action: "recommendation.created",
      entity: "CandidateRecommendation",
      entityId: String(recommendation._id),
      description: "Created a candidate recommendation.",
    });
    return created({ recommendation });
  } catch (error) {
    return handleError(error);
  }
}
