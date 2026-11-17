import type { Metadata } from "next";
import mongoose from "mongoose";
import Job from "@/models/Job";
import { connectDB } from "@/lib/mongodb";
import { JobDetail } from "@/components/site";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return { title: "Job details" };
  try {
    await connectDB();
    const job = await Job.findOne({ _id: id, status: "active" })
      .select("title shortDescription description location")
      .populate("companyId", "companyName")
      .lean();
    if (!job) return { title: "Job details" };
    const company = job.companyId as unknown as { companyName?: string };
    return {
      title: `${job.title} at ${company?.companyName || "a company"}`,
      description: job.shortDescription || job.description.slice(0, 155),
      alternates: { canonical: `/jobs/${id}` },
      openGraph: { type: "website", title: `${job.title} | JobZ`, description: job.shortDescription || job.description.slice(0, 155) },
    };
  } catch {
    return { title: "Job details" };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetail id={id} />;
}
