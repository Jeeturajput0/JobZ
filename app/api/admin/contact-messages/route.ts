import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

export async function GET(request: NextRequest) {
  const auth = await authorize(request, ["admin"]);
  if (!auth.authorized) return auth.response;
  try {
    await connectDB();
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Get contact messages error:", error);
    return NextResponse.json({ success: false, message: "Could not load contact messages." }, { status: 500 });
  }
}
