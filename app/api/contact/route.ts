import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.email !== "string" || typeof body.topic !== "string" || typeof body.message !== "string") return NextResponse.json({ success: false, message: "Please complete all contact fields." }, { status: 400 });
  const name = body.name.trim(); const email = body.email.trim().toLowerCase(); const topic = body.topic.trim(); const message = body.message.trim();
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || topic.length < 2 || topic.length > 80 || message.length < 2 || message.length > 5000) return NextResponse.json({ success: false, message: "Please check your name, email, topic, and message." }, { status: 400 });
  try {
    await connectDB();
    await ContactMessage.create({ name, email, topic, message });
    return NextResponse.json({ success: true, message: "Your message has been received." }, { status: 201 });
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json({ success: false, message: "Could not submit your message." }, { status: 500 });
  }
}
