import type { Metadata } from "next";
import mongoose from "mongoose";
import EmployerProfile from "@/models/EmployerProfile";
import { connectDB } from "@/lib/mongodb";
import { CompanyDetails } from "@/components/company-pages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!mongoose.Types.ObjectId.isValid(slug)) return { title: "Company profile" };
  try {
    await connectDB();
    const company = await EmployerProfile.findById(slug).select("companyName industry location description").lean();
    if (!company) return { title: "Company profile" };
    return {
      title: company.companyName,
      description: company.description?.slice(0, 155) || `Explore ${company.companyName} jobs and company information on JobZ.`,
      alternates: { canonical: `/companies/${slug}` },
      openGraph: { type: "website", title: `${company.companyName} | JobZ`, description: company.description?.slice(0, 155) || "Company profile and active opportunities on JobZ." },
    };
  } catch {
    return { title: "Company profile" };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CompanyDetails id={slug} />;
}
