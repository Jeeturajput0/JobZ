import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export async function GET() {
  try {
    await connectDB();
    const jobs = await Job.find({ status: "active" }).select("skills").lean();
    const counts = new Map<string, number>();
    for (const job of jobs) {
      for (const skill of job.skills || []) {
        const name = skill.trim();
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
    const skills = [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 5)
      .map(([name, jobs]) => ({ name, jobs }));
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error("Trending skills error:", error);
    return NextResponse.json({ success: false, message: "Could not load popular skills." }, { status: 500 });
  }
}
