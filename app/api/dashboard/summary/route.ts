import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import SavedJob from "@/models/SavedJob";
import User from "@/models/User";
import { publicJobFilter } from "@/lib/public-jobs";

export async function GET(request: NextRequest) {
  const auth = authorize(request, ["admin", "employer", "jobSeeker"]);
  if (!auth.authorized) return auth.response;
  await connectDB();
  const userId = auth.user.userId;
  if (auth.user.role === "admin") {
    const [members, seekers, employers, activeJobs, applications] = await Promise.all([
      User.countDocuments({ status: "active" }), User.countDocuments({ role: "jobSeeker", status: "active" }),
      User.countDocuments({ role: "employer", status: "active" }), Job.countDocuments(publicJobFilter()),
      Application.countDocuments({}),
    ]);
    return NextResponse.json({ success: true, summary: { members, seekers, employers, activeJobs, applications } });
  }
  if (auth.user.role === "employer") {
    const [jobs, activeJobs, applications] = await Promise.all([
      Job.countDocuments({ employerId: userId }), Job.countDocuments({ employerId: userId, ...publicJobFilter() }),
      Application.countDocuments({ employerId: userId }),
    ]);
    const profile = await EmployerProfile.findOne({ userId }).select("companyName").lean();
    return NextResponse.json({ success: true, summary: { jobs, activeJobs, applications, companyName: profile?.companyName || "" } });
  }
  const [applications, saved, activeJobs] = await Promise.all([
    Application.countDocuments({ jobSeekerId: userId }), SavedJob.countDocuments({ jobSeekerId: userId }),
    Job.countDocuments(publicJobFilter()),
  ]);
  return NextResponse.json({ success: true, summary: { applications, saved, activeJobs } });
}
