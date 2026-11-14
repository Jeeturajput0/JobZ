
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {connectDB} from "@/lib/mongodb";
import Job from "@/models/Job";
import { authorize } from "@/lib/authorize";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Get job ID from URL
    const { id } = await params;

    // 3. Validate job ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid job ID.",
        },
        { status: 400 }
      );
    }

    // 4. Find only active and approved job
    const job = await Job.findOne({
      _id: id,
      status: "active",
      approvalStatus: "approved",
    })
      .populate(
        "companyId",
        "companyName companyLogo industry website location description"
      )
      .lean();

    // 5. Check if job exists
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          message: "Job not found.",
        },
        { status: 404 }
      );
    }

    // 6. Return job details
    return NextResponse.json(
      {
        success: true,
        message: "Job details fetched successfully.",
        job,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get single job error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching job details.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const auth = authorize(request, ["employer", "admin"]);

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Job ID." },
        { status: 400 }
      );
    }

    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found." },
        { status: 404 }
      );
    }

    // Employer can delete only their own job
    if (
      auth.user.role === "employer" &&
      job.employerId.toString() !== auth.user.userId
    ) {
      return NextResponse.json(
        { success: false, message: "You cannot delete this job." },
        { status: 403 }
      );
    }

    job.status = "inactive";
    await job.save();

    return NextResponse.json(
      {
        success: true,
        message: "Job deactivated successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Job Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}