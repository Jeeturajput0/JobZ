import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import EmployerProfile from "@/models/EmployerProfile";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const base = ["", "/jobs", "/companies", "/about", "/contact"];
  try {
    await connectDB();
    const [jobs, companies] = await Promise.all([
      Job.find({ status: "active", approvalStatus: "approved" }).select("_id updatedAt").lean(),
      EmployerProfile.find({}).select("_id updatedAt").lean(),
    ]);
    return [
      ...base.map((path) => ({ url: new URL(path || "/", origin).toString(), changeFrequency: path === "/" ? "weekly" as const : "monthly" as const })),
      ...jobs.map((job) => ({ url: new URL(`/jobs/${job._id}`, origin).toString() })),
      ...companies.map((company) => ({ url: new URL(`/companies/${company._id}`, origin).toString() })),
    ];
  } catch {
    return base.map((path) => ({ url: new URL(path || "/", origin).toString(), changeFrequency: "monthly" }));
  }
}
