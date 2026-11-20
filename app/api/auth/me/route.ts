
import { NextRequest, NextResponse } from "next/server";

import {connectDB} from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { publicUsername } from "@/lib/public-profile";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import EmployerProfile from "@/models/EmployerProfile";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify login token
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    // 2. Connect to database
    await connectDB();

    // 3. Get latest user information from MongoDB
    const user = await User.findById(authUser.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 401 }
      );
    }

    // 4. Check account status
    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active.",
        },
        { status: 403 }
      );
    }

    const profile = user.role === "jobSeeker"
      ? await JobSeekerProfile.findOne({ userId: user._id }).select("profileImage").lean()
      : user.role === "employer"
        ? await EmployerProfile.findOne({ userId: user._id }).select("companyName companyLogo").lean()
        : null;
    if (!user.username) {
      const label = user.role === "employer" && profile && "companyName" in profile
        ? profile.companyName
        : user.fullName;
      user.username = publicUsername(label, user._id);
      await user.save();
    }

    // 5. Return current user
    return NextResponse.json(
      {
        success: true,
        message: "User authenticated successfully.",
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          profileImage: profile && "profileImage" in profile ? profile.profileImage : null,
          companyLogo: profile && "companyLogo" in profile ? profile.companyLogo : null,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}
