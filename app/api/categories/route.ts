import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export async function GET() {
  try {
    await connectDB();
    const categories = await Job.aggregate([
      { $match: { status: "active", approvalStatus: "approved" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return NextResponse.json({ success: true, categories: categories.map(({ _id, count }) => ({ name: _id, count })) });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json({ success: false, message: "Could not load job categories." }, { status: 500 });
  }
}
