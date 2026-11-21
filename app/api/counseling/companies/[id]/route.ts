import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, requireObjectId } from "@/lib/api";
import Company from "@/models/Company";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import Partnership from "@/models/Partnership";
import HiringRequest from "@/models/HiringRequest";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const auth = await requirePermission(request, ["counseling.contact.companies", "counseling.candidates.view"]);
    if (!auth.authorized) return auth.response;
    const id = requireObjectId((await ctx.params).id, "company id");
    const company = await Company.findOne({ _id: id, status: "active", verificationStatus: "verified" })
      .populate({ path: "ownerId", select: "fullName" })
      .populate({ path: "employerProfileId" }).lean();
    if (!company) return fail("Company not found or not eligible.", 404);

    const [jobs, partnership, hiringRequests] = await Promise.all([
      Job.find({ companyId: id, status: "active", approvalStatus: "approved" })
        .select("title description location jobType workMode experienceLevel skills minSalary maxSalary").sort({ createdAt: -1 }).lean(),
      Partnership.findOne({ companyId: id, counselingTeamId: auth.session.counselingTeamId || "" }).lean(),
      HiringRequest.find({ companyId: id }).select("jobTitle status priority numberOfOpenings createdAt").sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    return ok({ company, jobs, partnership, hiringRequests });
  } catch (error) {
    return handleError(error);
  }
}
