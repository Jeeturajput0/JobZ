import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, handleError, parsePagination } from "@/lib/api";
import Company from "@/models/Company";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import Partnership from "@/models/Partnership";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["counseling.contact.companies", "counseling.candidates.view"]);
    if (!auth.authorized) return auth.response;
    const sp = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp, 20);
    const query: Record<string, unknown> = { status: "active", verificationStatus: "verified" };
    const search = sp.get("search")?.trim();
    if (search) query.name = { $regex: search, $options: "i" };
    if (sp.get("industry")) query.industry = { $regex: sp.get("industry"), $options: "i" };

    const [companies, total] = await Promise.all([
      Company.find(query)
        .populate({ path: "employerProfileId", select: "companyName location industry description companyLogo website" })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Company.countDocuments(query),
    ]);
    const ids = companies.map((c) => String(c._id));
    const [jobs, partnerships] = await Promise.all([
      Job.find({ companyId: { $in: ids }, status: "active", approvalStatus: "approved" })
        .select("companyId title location jobType skills").sort({ createdAt: -1 }).lean(),
      Partnership.find({ counselingTeamId: auth.session.counselingTeamId || "", companyId: { $in: ids } }).lean(),
    ]);
    const jobsByCompany = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const key = String(job.companyId);
      jobsByCompany.set(key, [...(jobsByCompany.get(key) || []), job]);
    }
    const partnershipByCompany = new Map(partnerships.map((p) => [String(p.companyId), p]));
    return ok({
      companies: companies.map((c) => ({
        ...c,
        location: (c.employerProfileId as Record<string, unknown> | null)?.location || "",
        description: (c.employerProfileId as Record<string, unknown> | null)?.description || "",
        activeJobs: (jobsByCompany.get(String(c._id)) || []).length,
        jobs: (jobsByCompany.get(String(c._id)) || []).slice(0, 5),
        partnershipStatus: partnershipByCompany.get(String(c._id))?.status || "none",
        partnershipId: partnershipByCompany.has(String(c._id)) ? String(partnershipByCompany.get(String(c._id))?._id) : null,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    return handleError(error);
  }
}
