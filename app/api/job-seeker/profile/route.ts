
import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import { authorize } from "@/lib/authorize";
import { isValidProfileImage } from "@/lib/profile-image";

export async function PUT(request: NextRequest) {
  try {
    // 1. Only logged-in job seekers can update this profile
    const auth = await authorize(request, ["jobSeeker"]);

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    // 2. Read request body
    const body = await request.json();

    // 3. Allow only these profile fields
    const allowedFields = [
      "profileImage",
      "headline",
      "summary",
      "location",
      "skills",
      "education",
      "experience",
      "resumeUrl",
      "resumePublic",
      "portfolioUrl",
      "linkedInUrl",
    ] as const;

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 4. Validate basic field types
    const stringFields = [
      "profileImage",
      "headline",
      "summary",
      "location",
      "resumeUrl",
      "portfolioUrl",
      "linkedInUrl",
    ];

    for (const field of stringFields) {
      if (
        updateData[field] !== undefined &&
        typeof updateData[field] !== "string"
      ) {
        return NextResponse.json(
          { success: false, message: `${field} must be a string.` },
          { status: 400 }
        );
      }
    }

    if (typeof updateData.profileImage === "string" && !isValidProfileImage(updateData.profileImage)) {
      return NextResponse.json(
        { success: false, message: "Choose a valid PNG, JPEG, or WebP profile photo under 1 MB." },
        { status: 400 },
      );
    }

    if (
      updateData.skills !== undefined &&
      (!Array.isArray(updateData.skills) ||
        !updateData.skills.every((item) => typeof item === "string"))
    ) {
      return NextResponse.json(
        { success: false, message: "Skills must be an array of strings." },
        { status: 400 }
      );
    }

    if (updateData.resumePublic !== undefined && typeof updateData.resumePublic !== "boolean") {
      return NextResponse.json(
        { success: false, message: "resumePublic must be a boolean." },
        { status: 400 },
      );
    }

    if (updateData.resumeUrl === "") updateData.resumePublic = false;
    if (updateData.resumePublic === true && !updateData.resumeUrl) {
      const existingProfile = await JobSeekerProfile.findOne({ userId: auth.user.userId }).select("resumeUrl").lean();
      if (!existingProfile?.resumeUrl) {
        return NextResponse.json(
          { success: false, message: "Add a resume link before making it public." },
          { status: 400 },
        );
      }
    }

    if (
      updateData.education !== undefined &&
      !Array.isArray(updateData.education)
    ) {
      return NextResponse.json(
        { success: false, message: "Education must be an array." },
        { status: 400 }
      );
    }

    if (
      updateData.experience !== undefined &&
      !Array.isArray(updateData.experience)
    ) {
      return NextResponse.json(
        { success: false, message: "Experience must be an array." },
        { status: 400 }
      );
    }

    // 5. Create or update profile for this logged-in user
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { userId: auth.user.userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Job seeker profile saved successfully.",
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Job seeker profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving your profile.",
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    // 1. Verify logged-in job seeker
    const auth = await authorize(request, ["jobSeeker"]);

    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Find profile of logged-in user
    const profile = await JobSeekerProfile.findOne({
      userId: auth.user.userId,
    });

    // 4. Check if profile exists
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Job seeker profile not found.",
        },
        { status: 404 }
      );
    }

    // 5. Return profile
    return NextResponse.json(
      {
        success: true,
        message: "Profile fetched successfully.",
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get job seeker profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching profile.",
      },
      { status: 500 }
    );
  }
}
