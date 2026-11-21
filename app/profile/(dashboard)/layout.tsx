import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUserFromToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileShell } from "@/components/profile/shell";

export const dynamic = "force-dynamic";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const auth = getAuthUserFromToken(cookieStore.get("jobz_token")?.value);
  if (!auth || auth.role !== "jobSeeker") redirect("/login");

  await connectDB();
  const user = await User.findById(auth.userId).select("fullName status").lean();
  if (!user || user.status !== "active") redirect("/login");

  return <>
    <Navbar />
    <ProfileShell name={user.fullName || "Job Seeker"}>{children}</ProfileShell>
    <Footer />
  </>;
}
