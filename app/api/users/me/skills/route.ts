import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import { getUserSkills, resolveSkillIds, replaceUserSkills } from "@/lib/skills";

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ["jobSeeker"]);
  if (!auth.authorized) return auth.response;
  try {
    await connectDB();
    const skills = await getUserSkills(auth.user.userId);
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error("Candidate skills fetch error:", error);
    return NextResponse.json({ success: false, message: "Could not load your skills." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authorize(request, ["jobSeeker"]);
  if (!auth.authorized) return auth.response;
  try {
    let body: { skillIds?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Request body must be valid JSON." }, { status: 400 }); }
    await connectDB();
    const skills = await resolveSkillIds(body?.skillIds);
    await replaceUserSkills(auth.user.userId, skills);
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save your skills.";
    const status = /Select up to|selected skills/.test(message) ? 400 : 500;
    if (status === 500) console.error("Candidate skills update error:", error);
    return NextResponse.json({ success: false, message: status === 500 ? "Could not save your skills." : message }, { status });
  }
}
