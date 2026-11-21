import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Application from "@/models/Application";

const applicationStatuses = ["pending", "reviewed", "shortlisted", "interview", "rejected", "hired"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, ["employer"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Invalid application ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: "Request body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== "status" && key !== "interviewDate")) {
    return NextResponse.json({ success: false, message: "Only status and interviewDate can be updated." }, { status: 400 });
  }
  if (typeof input.status !== "string" || !applicationStatuses.includes(input.status as typeof applicationStatuses[number])) {
    return NextResponse.json({ success: false, message: "A valid application status is required." }, { status: 400 });
  }

  let interviewDate: Date | null = null;
  if (input.status === "interview") {
    if (typeof input.interviewDate !== "string" || !Number.isFinite(Date.parse(input.interviewDate))) {
      return NextResponse.json({ success: false, message: "Provide a valid interview date to set this status." }, { status: 400 });
    }
    interviewDate = new Date(input.interviewDate);
    if (interviewDate.getTime() < Date.now()) {
      return NextResponse.json({ success: false, message: "Interview date must be in the future." }, { status: 400 });
    }
  } else if (input.interviewDate !== undefined && input.interviewDate !== null) {
    return NextResponse.json({ success: false, message: "interviewDate is only allowed for interview status." }, { status: 400 });
  }

  try {
    await connectDB();
    const application = await Application.findOneAndUpdate(
      { _id: id, employerId: new mongoose.Types.ObjectId(auth.user.userId) },
      { $set: { status: input.status, interviewDate } },
      { new: true, runValidators: true },
    ).lean();

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Application status updated.", application });
  } catch (error) {
    console.error("Update employer application error:", error);
    return NextResponse.json({ success: false, message: "Could not update the application." }, { status: 500 });
  }
}
