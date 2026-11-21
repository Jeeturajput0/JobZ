
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import {connectDB} from "@/lib/mongodb";
import Job from "@/models/Job";
import { authorize } from "@/lib/authorize";
import { replaceJobSkills, resolveLegacySkillNames } from "@/lib/skills";
import { publicJobFilter } from "@/lib/public-jobs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const JOB_TYPES = ["full-time", "part-time", "internship", "contract"];
const WORK_MODES = ["onsite", "remote", "hybrid"];

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const auth = await authorize(request, ["admin", "employer"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid job ID." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
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

  const input = body as Record<string, unknown>;
  const editableFields = [
    "title",
    "slug",
    "category",
    "shortDescription",
    "description",
    "responsibilities",
    "requirements",
    "skills",
    "jobType",
    "workMode",
    "experienceLevel",
    "minSalary",
    "maxSalary",
    "location",
    "benefits",
    "applicationDeadline",
    "isFeatured",
    "approvalStatus",
  ];
  const unknownFields = Object.keys(input).filter(
    (field) => !editableFields.includes(field),
  );
  if (unknownFields.length) {
    return NextResponse.json(
      {
        success: false,
        message: `These fields cannot be updated: ${unknownFields.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (auth.user.role === "employer") {
    const employerEditableFields = new Set([
      "title", "category", "shortDescription", "description", "responsibilities",
      "requirements", "skills", "jobType", "workMode", "experienceLevel",
      "minSalary", "maxSalary", "location", "benefits", "applicationDeadline",
    ]);
    const restrictedFields = Object.keys(input).filter((field) => !employerEditableFields.has(field));
    if (restrictedFields.length) {
      return NextResponse.json(
        { success: false, message: `Employers cannot update these fields: ${restrictedFields.join(", ")}.` },
        { status: 403 },
      );
    }
  }

  if ("approvalStatus" in input) {
    if (auth.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Only admins can review job posts." }, { status: 403 });
    }
    if (!["pending", "approved", "rejected"].includes(input.approvalStatus as string)) {
      return NextResponse.json({ success: false, message: "Invalid job approval status." }, { status: 400 });
    }
  }

  for (const field of ["title", "slug", "category", "description", "experienceLevel", "location"]) {
    if (field in input && (typeof input[field] !== "string" || !input[field].trim())) {
      return NextResponse.json(
        { success: false, message: `${field} is required and must be text.` },
        { status: 400 },
      );
    }
  }
  if (
    "shortDescription" in input &&
    (typeof input.shortDescription !== "string" ||
      !input.shortDescription.trim() ||
      input.shortDescription.trim().length > 160)
  ) {
    return NextResponse.json(
      { success: false, message: "shortDescription is required and must be 1–160 characters." },
      { status: 400 },
    );
  }
  if ("jobType" in input && !JOB_TYPES.includes(input.jobType as string)) {
    return NextResponse.json(
      { success: false, message: "Invalid job type." },
      { status: 400 },
    );
  }
  if ("workMode" in input && !WORK_MODES.includes(input.workMode as string)) {
    return NextResponse.json(
      { success: false, message: "Invalid work mode." },
      { status: 400 },
    );
  }
  for (const field of ["responsibilities", "requirements", "skills", "benefits"]) {
    if (
      field in input &&
      (!Array.isArray(input[field]) ||
        !input[field].every((value) => typeof value === "string"))
    ) {
      return NextResponse.json(
        { success: false, message: `${field} must be an array of strings.` },
        { status: 400 },
      );
    }
  }
  for (const field of ["minSalary", "maxSalary"]) {
    const value = input[field];
    if (
      field in input &&
      value !== null &&
      (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    ) {
      return NextResponse.json(
        { success: false, message: `${field} must be a non-negative number or null.` },
        { status: 400 },
      );
    }
  }
  if ("isFeatured" in input && typeof input.isFeatured !== "boolean") {
    return NextResponse.json(
      { success: false, message: "isFeatured must be a boolean." },
      { status: 400 },
    );
  }
  if (
    "applicationDeadline" in input &&
    input.applicationDeadline !== null &&
    (typeof input.applicationDeadline !== "string" ||
      Number.isNaN(Date.parse(input.applicationDeadline)))
  ) {
    return NextResponse.json(
      { success: false, message: "applicationDeadline must be a valid date or null." },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    let selectedSkills: Awaited<ReturnType<typeof resolveLegacySkillNames>> | undefined;
    if ("skills" in input) {
      try {
        selectedSkills = await resolveLegacySkillNames(input.skills);
        if (selectedSkills.length > 20) throw new Error("Select up to 20 skills.");
      } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Please provide valid skills." }, { status: 400 });
      }
    }
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job not found." },
        { status: 404 },
      );
    }

    if (auth.user.role === "employer" && job.employerId.toString() !== auth.user.userId) {
      return NextResponse.json(
        { success: false, message: "You cannot update this job." },
        { status: 403 },
      );
    }

    const approvalChanged =
      "approvalStatus" in input && input.approvalStatus !== job.approvalStatus;

    const nextMin = "minSalary" in input ? input.minSalary : job.minSalary;
    const nextMax = "maxSalary" in input ? input.maxSalary : job.maxSalary;
    if (
      typeof nextMin === "number" &&
      typeof nextMax === "number" &&
      nextMin > nextMax
    ) {
      return NextResponse.json(
        { success: false, message: "minSalary cannot exceed maxSalary." },
        { status: 400 },
      );
    }

    for (const [field, value] of Object.entries(input)) {
      job.set(field, field === "applicationDeadline" && value ? new Date(value as string) : value);
    }
    if (approvalChanged) {
      job.set("reviewedBy", new mongoose.Types.ObjectId(auth.user.userId));
      job.set("reviewedAt", new Date());
    }
    await job.save();
    if (selectedSkills) await replaceJobSkills(job._id, selectedSkills);
    await job.populate("companyId", "companyName companyLogo industry location website description");

    return NextResponse.json({
      success: true,
      message: "Job updated successfully.",
      job,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, message: "A job already uses this slug." },
        { status: 409 },
      );
    }
    console.error("Admin update job error:", error);
    return NextResponse.json(
      { success: false, message: "Could not update this job." },
      { status: 500 },
    );
  }
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
    const job = await Job.findOne({ _id: id, ...publicJobFilter() })
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
    const auth = await authorize(request, ["employer", "admin"]);

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
