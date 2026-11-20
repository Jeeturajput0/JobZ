import { NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/public-profile-data";

export async function GET(_request: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;
    const profile = await getPublicProfile(username);
    if (!profile) return NextResponse.json({ success: false, message: "Profile not found." }, { status: 404 });
    return NextResponse.json({ success: true, profile }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Public profile fetch error:", error);
    return NextResponse.json({ success: false, message: "Could not load this profile." }, { status: 500 });
  }
}
