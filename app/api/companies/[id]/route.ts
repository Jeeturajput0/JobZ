import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Company not found." }, { status: 404 });
  }
  try {
    await connectDB();
    const [profile, jobCount] = await Promise.all([
      EmployerProfile.findById(id).select("companyName companyLogo industry location companySize description website socialLinks").lean(),
      Job.countDocuments({ companyId: id, status: "active" }),
    ]);
    if (!profile) return NextResponse.json({ success: false, message: "Company not found." }, { status: 404 });
    return NextResponse.json({ success: true, company: {
      id: String(profile._id), name: profile.companyName, logo: profile.companyLogo || "",
      industry: profile.industry || "", location: profile.location || "", companySize: profile.companySize || "",
      description: profile.description || "", website: profile.website || "", socialLinks: profile.socialLinks || {}, jobCount,
    } });
  } catch (error) {
    console.error("Get company profile error:", error);
    return NextResponse.json({ success: false, message: "Could not load company profile." }, { status: 500 });
  }
}
