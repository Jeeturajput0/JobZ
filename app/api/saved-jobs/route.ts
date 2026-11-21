import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import SavedJob from "@/models/SavedJob";
import { publicJobFilter } from "@/lib/public-jobs";

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ["jobSeeker"]);
  if (!auth.authorized) return auth.response;
  try {
    await connectDB();
    const records = await SavedJob.find({ jobSeekerId: auth.user.userId }).populate({ path: "jobId", model: Job, match: publicJobFilter(), populate: { path: "companyId", select: "companyName companyLogo industry" } }).lean();
    return NextResponse.json({ success: true, savedJobs: records.filter((record) => record.jobId).map((record) => ({ id: String(record.jobId._id), savedId: String(record._id), job: record.jobId })) });
  } catch (error) {
    console.error("Get saved jobs error:", error);
    return NextResponse.json({ success: false, message: "Could not load saved jobs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request, ["jobSeeker"]);
  if (!auth.authorized) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.jobId !== "string" || !mongoose.Types.ObjectId.isValid(body.jobId)) return NextResponse.json({ success: false, message: "A valid jobId is required." }, { status: 400 });
  try {
    await connectDB();
    const job = await Job.findOne({ _id: body.jobId, ...publicJobFilter() }).select("_id");
    if (!job) return NextResponse.json({ success: false, message: "Active job not found." }, { status: 404 });
    await SavedJob.updateOne({ jobSeekerId: auth.user.userId, jobId: job._id }, { $setOnInsert: { jobSeekerId: auth.user.userId, jobId: job._id } }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save job error:", error);
    return NextResponse.json({ success: false, message: "Could not save job." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authorize(request, ["jobSeeker"]);
  if (!auth.authorized) return auth.response;
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) return NextResponse.json({ success: false, message: "A valid jobId is required." }, { status: 400 });
  try {
    await connectDB();
    await SavedJob.deleteOne({ jobSeekerId: auth.user.userId, jobId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsave job error:", error);
    return NextResponse.json({ success: false, message: "Could not remove saved job." }, { status: 500 });
  }
}
