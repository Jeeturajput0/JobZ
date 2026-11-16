import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = authorize(request, ["admin"]);
  if (!auth.authorized) return auth.response;
  try {
    await connectDB();
    const applications = await Application.find({}).populate({ path: "jobId", model: Job, select: "title" }).populate({ path: "jobSeekerId", model: User, select: "fullName email" }).sort({ appliedAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error("Get admin applications error:", error);
    return NextResponse.json({ success: false, message: "Could not load applications." }, { status: 500 });
  }
}
