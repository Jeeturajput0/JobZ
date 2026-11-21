import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import { getJobSkills, resolveSkillIds, replaceJobSkills } from "@/lib/skills";
import Job from "@/models/Job";

type Context = { params: Promise<{ id: string }> };

async function findAuthorizedJob(id: string, request: NextRequest, roles: ("admin" | "employer" | "jobSeeker")[]) {
  const auth = await authorize(request, roles);
  if (!auth.authorized) return { response: auth.response } as const;
  if (!mongoose.Types.ObjectId.isValid(id)) return { response: NextResponse.json({ success: false, message: "Invalid job ID." }, { status: 400 }) } as const;
  const job = await Job.findById(id);
  if (!job) return { response: NextResponse.json({ success: false, message: "Job not found." }, { status: 404 }) } as const;
  if (auth.user.role === "employer" && job.employerId.toString() !== auth.user.userId) {
    return { response: NextResponse.json({ success: false, message: "You cannot access this job's skills." }, { status: 403 }) } as const;
  }
  if (auth.user.role === "jobSeeker" && job.status !== "active") {
    return { response: NextResponse.json({ success: false, message: "Job not found." }, { status: 404 }) } as const;
  }
  return { auth, job } as const;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await connectDB();
    const result = await findAuthorizedJob(id, request, ["admin", "employer", "jobSeeker"]);
    if ("response" in result) return result.response;
    const skills = await getJobSkills(result.job._id, result.job.skills || []);
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error("Job skills fetch error:", error);
    return NextResponse.json({ success: false, message: "Could not load job skills." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await connectDB();
    const result = await findAuthorizedJob(id, request, ["admin", "employer"]);
    if ("response" in result) return result.response;
    let body: { skillIds?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Request body must be valid JSON." }, { status: 400 }); }
    const skills = await resolveSkillIds(body?.skillIds);
    await replaceJobSkills(result.job._id, skills);
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save job skills.";
    const status = /Select up to|selected skills/.test(message) ? 400 : 500;
    if (status === 500) console.error("Job skills update error:", error);
    return NextResponse.json({ success: false, message: status === 500 ? "Could not save job skills." : message }, { status });
  }
}
