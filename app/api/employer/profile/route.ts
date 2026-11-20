
import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import EmployerProfile from "@/models/EmployerProfile";
import { authorize } from "@/lib/authorize";
import { isValidProfileImage } from "@/lib/profile-image";
import User from "@/models/User";
import { publicUsername } from "@/lib/public-profile";

export async function PUT(request: NextRequest) {
  try {
    // 1. Only employers can create or update company profiles
    const auth = authorize(request, ["employer"]);

    if (!auth.authorized) {
      return auth.response;
    }

    await connectDB();

    // 2. Get request data
    const body = await request.json();

    // 3. Validate company name
    if (
      body.companyName !== undefined &&
      typeof body.companyName !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Company name must be a string." },
        { status: 400 }
      );
    }

    const companyName = body.companyName?.trim();

    if (companyName !== undefined && companyName.length < 2) {
      return NextResponse.json(
        { success: false, message: "Company name must have at least 2 characters." },
        { status: 400 }
      );
    }

    // 4. Allow only permitted fields
    const allowedFields = [
      "companyName",
      "companyLogo",
      "industry",
      "companySize",
      "website",
      "location",
      "description",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (
          field !== "companyName" &&
          typeof body[field] !== "string"
        ) {
          return NextResponse.json(
            { success: false, message: `${field} must be a string.` },
            { status: 400 }
          );
        }

        updateData[field] =
          typeof body[field] === "string"
            ? body[field].trim()
            : body[field];
      }
    }

    if (typeof updateData.companyLogo === "string" && !isValidProfileImage(updateData.companyLogo)) {
      return NextResponse.json(
        { success: false, message: "Choose a valid PNG, JPEG, or WebP logo under 1 MB." },
        { status: 400 },
      );
    }

    // 5. Validate social links
    if (body.socialLinks !== undefined) {
      const links = body.socialLinks;

      if (
        !links ||
        typeof links !== "object" ||
        Array.isArray(links) ||
        Object.keys(links).some(
          (key) => !["linkedin", "facebook", "instagram"].includes(key)
        ) ||
        Object.values(links).some(
          (value) => typeof value !== "string"
        )
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid social links." },
          { status: 400 }
        );
      }

      updateData.socialLinks = links;
    }

    // 6. Check whether company profile already exists
    const existingProfile = await EmployerProfile.findOne({
      userId: auth.user.userId,
    });

    if (!existingProfile && !companyName) {
      return NextResponse.json(
        {
          success: false,
          message: "Company name is required to create a profile.",
        },
        { status: 400 }
      );
    }

    // 7. Create or update employer profile
    const profile = await EmployerProfile.findOneAndUpdate(
      { userId: auth.user.userId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
    if (companyName) {
      const user = await User.findById(auth.user.userId).select("_id username");
      if (user) {
        user.username = publicUsername(companyName, user._id);
        await user.save();
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Company profile saved successfully.",
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Employer profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving company profile.",
      },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    // 1. Verify employer login
    const auth = authorize(request, ["employer"]);

    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Find company profile of logged-in employer
    const profile = await EmployerProfile.findOne({
      userId: auth.user.userId,
    });

    // 4. Check if profile exists
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Company profile not found.",
        },
        { status: 404 }
      );
    }

    // 5. Return company profile
    return NextResponse.json(
      {
        success: true,
        message: "Company profile fetched successfully.",
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get employer profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while fetching company profile.",
      },
      { status: 500 }
    );
  }
}
