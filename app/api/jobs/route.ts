
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import mongoose from "mongoose";

import {connectDB} from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import EmployerProfile from "@/models/EmployerProfile";
import { authorize } from "@/lib/authorize";

const JOB_TYPES = ["full-time", "part-time", "internship", "contract"] as const;
const WORK_MODES = ["onsite", "remote", "hybrid"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(params.get("limit") || "10", 10) || 10),
    );
    const search = params.get("search")?.trim();
    const category = params.get("category")?.trim();
    const location = params.get("location")?.trim();
    const jobType = params.get("jobType");
    const workMode = params.get("workMode");

    if (jobType && !JOB_TYPES.includes(jobType as (typeof JOB_TYPES)[number])) {
      return NextResponse.json(
        { success: false, message: "Invalid job type." },
        { status: 400 },
      );
    }

    if (workMode && !WORK_MODES.includes(workMode as (typeof WORK_MODES)[number])) {
      return NextResponse.json(
        { success: false, message: "Invalid work mode." },
        { status: 400 },
      );
    }

    const filter: Record<string, unknown> = {
      status: "active",
      approvalStatus: "approved",
    };

    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { title: expression },
        { description: expression },
        { category: expression },
      ];
    }
    if (category) filter.category = category;
    if (location) filter.location = new RegExp(escapeRegex(location), "i");
    if (jobType) filter.jobType = jobType;
    if (workMode) filter.workMode = workMode;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate(
          "companyId",
          "companyName companyLogo industry website location description",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      message: "Jobs fetched successfully.",
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong while fetching jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Employer and Admin can create jobs
    const auth = authorize(request, ["employer", "admin"]);

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    const body = await request.json();

    const {
      title,
      category,
      description,
      responsibilities,
      requirements,
      skills,
      jobType,
      workMode,
      experienceLevel,
      minSalary,
      maxSalary,
      location,
      benefits,
      applicationDeadline,
      employerId: requestedEmployerId,
      companyId: requestedCompanyId,
    } = body;

    // 2. Validate required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      typeof experienceLevel !== "string" ||
      !experienceLevel.trim() ||
      !["full-time", "part-time", "internship", "contract"].includes(jobType) ||
      !["onsite", "remote", "hybrid"].includes(workMode)
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide valid required job details." },
        { status: 400 }
      );
    }

    // 3. Validate optional arrays
    const arrays = { responsibilities, requirements, skills, benefits };

    for (const [field, value] of Object.entries(arrays)) {
      if (
        value !== undefined &&
        (!Array.isArray(value) ||
          !value.every((item) => typeof item === "string"))
      ) {
        return NextResponse.json(
          { success: false, message: `${field} must be an array of strings.` },
          { status: 400 }
        );
      }
    }

    // 4. Validate salary
    if (
      (minSalary !== undefined &&
        (typeof minSalary !== "number" || minSalary < 0)) ||
      (maxSalary !== undefined &&
        (typeof maxSalary !== "number" || maxSalary < 0)) ||
      (minSalary !== undefined &&
        maxSalary !== undefined &&
        minSalary > maxSalary)
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid salary range." },
        { status: 400 }
      );
    }

    // 5. Resolve company and employer ownership
    let employerId: string;
    let companyId: string;

    if (auth.user.role === "employer") {
      employerId = auth.user.userId;

      const company = await EmployerProfile.findOne({
        userId: employerId,
      });

      if (!company) {
        return NextResponse.json(
          { success: false, message: "Please create your company profile first." },
          { status: 400 }
        );
      }

      companyId = company._id.toString();
    } else {
      if (
        typeof requestedEmployerId !== "string" ||
        typeof requestedCompanyId !== "string" ||
        !mongoose.Types.ObjectId.isValid(requestedEmployerId) ||
        !mongoose.Types.ObjectId.isValid(requestedCompanyId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin must provide a valid employerId and companyId.",
          },
          { status: 400 }
        );
      }

      const employer = await User.findOne({
        _id: requestedEmployerId,
        role: "employer",
        status: "active",
      });

      const company = await EmployerProfile.findOne({
        _id: requestedCompanyId,
        userId: requestedEmployerId,
      });

      if (!employer || !company) {
        return NextResponse.json(
          { success: false, message: "Employer or company profile not found." },
          { status: 404 }
        );
      }

      employerId = employer._id.toString();
      companyId = company._id.toString();
    }

    // 6. Generate a unique URL slug
    const baseSlug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "job";

    const slug = `${baseSlug}-${randomBytes(4).toString("hex")}`;

    // 7. Create job
    const job = await Job.create({
      employerId,
      companyId,
      title: title.trim(),
      slug,
      category: category.trim(),
      description: description.trim(),
      responsibilities: responsibilities || [],
      requirements: requirements || [],
      skills: skills || [],
      jobType,
      workMode,
      experienceLevel: experienceLevel.trim(),
      minSalary,
      maxSalary,
      location: location.trim(),
      benefits: benefits || [],
      applicationDeadline,
      status: "draft",
      approvalStatus: "pending",
      isFeatured: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Job created successfully and is awaiting approval.",
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the job.",
      },
      { status: 500 }
    );
  }
}
