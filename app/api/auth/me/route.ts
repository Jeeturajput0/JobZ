import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { publicUsername } from "@/lib/public-profile";
import { ROLE_LABELS, ROLE_DASHBOARD } from "@/lib/constants";
import User from "@/models/User";
import JobSeekerProfile from "@/models/JobSeekerProfile";
import EmployerProfile from "@/models/EmployerProfile";
import Company from "@/models/Company";
import CounselingTeam from "@/models/CounselingTeam";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 },
      );
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 401 },
      );
    }

    const profile =
      session.role === "jobSeeker"
        ? await JobSeekerProfile.findOne({ userId: user._id })
            .select("profileImage")
            .lean()
        : ["employer", "companyMember"].includes(session.role)
          ? await EmployerProfile.findOne({ userId: user._id })
              .select("companyName companyLogo")
              .lean()
          : null;

    if (!user.username) {
      const label =
        session.role === "employer" && profile && "companyName" in profile
          ? String(profile.companyName)
          : user.fullName;
      user.username = publicUsername(label, user._id);
      await user.save();
    }

    const company = session.companyId
      ? await Company.findById(session.companyId).select("name verificationStatus status").lean()
      : null;
    const counselingTeam = session.counselingTeamId
      ? await CounselingTeam.findById(session.counselingTeamId).select("name status").lean()
      : null;

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
          roleLabel: ROLE_LABELS[user.role],
          dashboard: ROLE_DASHBOARD[user.role],
          companyId: session.companyId,
          company,
          counselingTeamId: session.counselingTeamId,
          counselingTeam,
          roleId: session.roleId,
          permissions: session.permissions,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
