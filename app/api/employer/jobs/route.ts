import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ["employer"]);
  if (!auth.authorized) return auth.response;
  try {
    await connectDB();
    const jobs = await Job.find({ employerId: auth.user.userId }).populate({ path: "companyId", model: EmployerProfile, select: "companyName companyLogo" }).sort({ createdAt: -1 }).lean();
    const ids = jobs.map((job) => job._id);
    const counts = await Application.aggregate([{ $match: { jobId: { $in: ids } } }, { $group: { _id: "$jobId", count: { $sum: 1 } } }]);
    const countByJob = new Map(counts.map((item) => [String(item._id), item.count as number]));
    return NextResponse.json({ success: true, jobs: jobs.map((job) => ({ ...job, applicationCount: countByJob.get(String(job._id)) || 0 })) });
  } catch (error) {
    console.error("Get employer jobs error:", error);
    return NextResponse.json({ success: false, message: "Could not load your job posts." }, { status: 500 });
  }
}
