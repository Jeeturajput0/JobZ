
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {connectDB} from "@/lib/mongodb";
import Job from "@/models/Job";
import { authorize } from "@/lib/authorize";

export async function PATCH(request: NextRequest) {
  try {
    // 1. Only Admin can approve or reject jobs
    const auth = authorize(request, ["admin"]);

    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Get request body
    const body = await request.json();
    const { jobId, action } = body;

    // 4. Validate Job ID
    if (
      typeof jobId !== "string" ||
      !mongoose.Types.ObjectId.isValid(jobId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid job ID.",
        },
        { status: 400 }
      );
    }

    // 5. Validate action
    if (
      typeof action !== "string" ||
      !["approve", "reject"].includes(action)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be approve or reject.",
        },
        { status: 400 }
      );
    }

    // 6. Find job
    const job = await Job.findById(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          message: "Job not found.",
        },
        { status: 404 }
      );
    }

    // 7. Approve or reject job
    if (action === "approve") {
      job.approvalStatus = "approved";
      job.status = "active";
    } else {
      job.approvalStatus = "rejected";
      job.status = "inactive";
    }

    // 8. Save updated job
    await job.save();

    // 9. Return response
    return NextResponse.json(
      {
        success: true,
        message:
          action === "approve"
            ? "Job approved successfully."
            : "Job rejected successfully.",
        job: {
          id: job._id,
          title: job.title,
          slug: job.slug,
          status: job.status,
          approvalStatus: job.approvalStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Job approval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating job approval.",
      },
      { status: 500 }
    );
  }
}
