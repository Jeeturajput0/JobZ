import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import Application from "@/models/Application";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import { publicJobFilter } from "@/lib/public-jobs";

type ApplyRequestBody = {
  jobId?: unknown;
  resumeUrl?: unknown;
  coverLetter?: unknown;
};

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function GET(request: NextRequest) {
  const auth = authorize(request, ["jobSeeker"]);

  if (!auth.authorized) {
    return auth.response;
  }

  if (!/^[a-f\d]{24}$/i.test(auth.user.userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid user session." },
      { status: 401 },
    );
  }

  const pageValue = request.nextUrl.searchParams.get("page") ?? "1";
  const limitValue = request.nextUrl.searchParams.get("limit") ?? "10";

  if (!/^\d+$/.test(pageValue) || Number(pageValue) < 1) {
    return NextResponse.json(
      { success: false, message: "page must be a positive integer." },
      { status: 400 },
    );
  }

  if (!/^\d+$/.test(limitValue) || Number(limitValue) < 1 || Number(limitValue) > 100) {
    return NextResponse.json(
      { success: false, message: "limit must be an integer between 1 and 100." },
      { status: 400 },
    );
  }

  const page = Number(pageValue);
  const limit = Number(limitValue);
  const jobSeekerId = new mongoose.Types.ObjectId(auth.user.userId);

  try {
    await connectDB();

    const [applications, total] = await Promise.all([
      Application.find({ jobSeekerId })
        .populate({
          path: "jobId",
          select:
            "title slug category location jobType workMode minSalary maxSalary status approvalStatus companyId",
          populate: {
            path: "companyId",
            select: "companyName companyLogo industry website location",
            model: EmployerProfile,
          },
        })
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Application.countDocuments({ jobSeekerId }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your applications were fetched successfully.",
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching your applications.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = authorize(request, ["jobSeeker"]);

  if (!auth.authorized) {
    return auth.response;
  }

  let body: ApplyRequestBody;

  try {
    body = (await request.json()) as ApplyRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, message: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  if (typeof body.jobId !== "string" || !/^[a-f\d]{24}$/i.test(body.jobId)) {
    return NextResponse.json(
      { success: false, message: "A valid jobId is required." },
      { status: 400 },
    );
  }

  if (body.resumeUrl !== undefined && typeof body.resumeUrl !== "string") {
    return NextResponse.json(
      { success: false, message: "resumeUrl must be a string." },
      { status: 400 },
    );
  }

  if (body.coverLetter !== undefined && typeof body.coverLetter !== "string") {
    return NextResponse.json(
      { success: false, message: "coverLetter must be a string." },
      { status: 400 },
    );
  }

  const resumeUrl = typeof body.resumeUrl === "string" ? body.resumeUrl.trim() : "";
  const coverLetter = typeof body.coverLetter === "string" ? body.coverLetter.trim() : "";

  if (resumeUrl) {
    try {
      const parsedUrl = new URL(resumeUrl);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        throw new Error("Unsupported URL protocol.");
      }
    } catch {
      return NextResponse.json(
        { success: false, message: "resumeUrl must be a valid HTTP or HTTPS URL." },
        { status: 400 },
      );
    }
  }

  if (coverLetter.length > 10_000) {
    return NextResponse.json(
      { success: false, message: "coverLetter cannot exceed 10,000 characters." },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const job = await Job.findOne({
      _id: new mongoose.Types.ObjectId(body.jobId),
      ...publicJobFilter(),
    }).select("_id employerId");

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found or is not accepting applications." },
        { status: 404 },
      );
    }

    const jobSeekerId = new mongoose.Types.ObjectId(auth.user.userId);
    const existingApplication = await Application.findOne({
      jobId: job._id,
      jobSeekerId,
    }).select("_id");

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: "You have already applied for this job." },
        { status: 409 },
      );
    }

    const application = await Application.create({
      jobId: job._id,
      jobSeekerId,
      employerId: job.employerId,
      resumeUrl,
      coverLetter,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully.",
        application: {
          id: application._id.toString(),
          jobId: application.jobId.toString(),
          jobSeekerId: application.jobSeekerId.toString(),
          employerId: application.employerId.toString(),
          resumeUrl: application.resumeUrl,
          coverLetter: application.coverLetter,
          status: application.status,
          appliedAt: application.appliedAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, message: "You have already applied for this job." },
        { status: 409 },
      );
    }

    console.error("Create application error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong while submitting your application." },
      { status: 500 },
    );
  }
}
