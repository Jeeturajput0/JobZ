import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import Job from "@/models/Job";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ["employer"]);
  if (!auth.authorized) return auth.response;
  try {
    await connectDB();
    const applications = await Application.find({ employerId: auth.user.userId }).populate({ path: "jobId", model: Job, select: "title location" }).populate({ path: "jobSeekerId", model: User, select: "fullName email" }).sort({ appliedAt: -1 }).lean();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error("Get employer applications error:", error);
    return NextResponse.json({ success: false, message: "Could not load applicants." }, { status: 500 });
  }
}
