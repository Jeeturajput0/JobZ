import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Skill from "@/models/Skill";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "Invalid skill ID." }, { status: 400 });
    await connectDB();
    const skill = await Skill.findById(id).lean();
    if (!skill) return NextResponse.json({ success: false, message: "Skill not found." }, { status: 404 });
    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error("Skill detail error:", error);
    return NextResponse.json({ success: false, message: "Could not load skill." }, { status: 500 });
  }
}
