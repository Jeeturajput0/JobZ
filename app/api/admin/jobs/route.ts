import { NextRequest, NextResponse } from "next/server";

import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import EmployerProfile from "@/models/EmployerProfile";
import Job from "@/models/Job";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ["admin"]);
  if (!auth.authorized) return auth.response;

  const rawPage = request.nextUrl.searchParams.get("page") ?? "1";
  const rawLimit = request.nextUrl.searchParams.get("limit") ?? "50";
  if (!/^\d+$/.test(rawPage) || Number(rawPage) < 1) {
    return NextResponse.json(
      { success: false, message: "page must be a positive integer." },
      { status: 400 },
    );
  }
  if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 100) {
    return NextResponse.json(
      { success: false, message: "limit must be an integer between 1 and 100." },
      { status: 400 },
    );
  }

  const page = Number(rawPage);
  const limit = Number(rawLimit);

  try {
    await connectDB();
    const filter = { status: { $ne: "inactive" as const } };
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate({
          path: "companyId",
          model: EmployerProfile,
          select: "companyName companyLogo industry location website description",
        })
        .populate({
          path: "employerId",
          model: User,
          select: "fullName",
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      message: "Admin jobs fetched successfully.",
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin jobs fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Could not load admin jobs." },
      { status: 500 },
    );
  }
}
