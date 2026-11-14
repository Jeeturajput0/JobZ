import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = authorize(request, ["admin"]);
  if (!auth.authorized) return auth.response;
  const role = request.nextUrl.searchParams.get("role");
  if (role !== "jobSeeker" && role !== "employer") return NextResponse.json({ success: false, message: "A supported user role is required." }, { status: 400 });
  try {
    await connectDB();
    const users = await User.find({ role }).select("fullName email status createdAt").sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json({ success: false, message: "Could not load users." }, { status: 500 });
  }
}
