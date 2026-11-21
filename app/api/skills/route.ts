import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateSkill, normalizeSkillName } from "@/lib/skills";
import { listSkills } from "@/lib/skills-api";

export async function GET(request: NextRequest) { return listSkills(request); }

export async function POST(request: NextRequest) {
  const auth = await authorize(request, ["admin", "employer", "jobSeeker"]);
  if (!auth.authorized) return auth.response;
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Request body must be valid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, message: "Request body must be an object." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? normalizeSkillName(input.name) : "";
    const category = typeof input.category === "string" ? normalizeSkillName(input.category) : "General";
    if (!name || name.length > 80 || category.length > 60) return NextResponse.json({ success: false, message: "Skill name must be 1â€“80 characters and category up to 60 characters." }, { status: 400 });
    await connectDB();
    const skill = await getOrCreateSkill(name, category);
    return NextResponse.json({ success: true, skill }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create skill.";
    const status = message.includes("between 1 and 80") ? 400 : 500;
    if (status === 500) console.error("Skill creation error:", error);
    return NextResponse.json({ success: false, message: status === 500 ? "Could not create skill." : message }, { status });
  }
}
