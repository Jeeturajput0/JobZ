import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { normalizeSkillName } from "@/lib/skills";
import Skill from "@/models/Skill";

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function listSkills(request: NextRequest) {
  try {
    await connectDB();
    const query = normalizeSkillName(request.nextUrl.searchParams.get("q") || "");
    if (query.length > 80) return NextResponse.json({ success: false, message: "Search text is too long." }, { status: 400 });
    const filter = query ? { normalizedName: { $regex: escapeRegex(query.toLocaleLowerCase("en-US")) } } : {};
    const skillQuery = Skill.find(filter).sort({ name: 1 });
    if (query) skillQuery.limit(50);
    const skills = await skillQuery.lean();
    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error("Skills fetch error:", error);
    return NextResponse.json({ success: false, message: "Could not load skills." }, { status: 500 });
  }
}
