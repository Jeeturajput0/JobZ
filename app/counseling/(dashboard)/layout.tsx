import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUserFromToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CounselingTeam from "@/models/CounselingTeam";
import { CounselingShell } from "@/components/counseling/shell";

export const dynamic = "force-dynamic";

export default async function CounselingLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const auth = getAuthUserFromToken(cookieStore.get("jobz_token")?.value);
  if (!auth || !["counselingAdmin", "counselingMember"].includes(auth.role)) redirect("/login");

  await connectDB();
  const user = await User.findById(auth.userId).select("fullName email status role counselingTeamId").lean();
  if (!user || user.status !== "active" || !user.counselingTeamId) redirect("/login");

  const team = await CounselingTeam.findById(user.counselingTeamId).select("name").lean();
  return (
    <CounselingShell
      name={user.fullName || "Counselor"}
      email={user.email || ""}
      isAdmin={auth.role === "counselingAdmin"}
      organization={team?.name || "Counseling Organization"}
    >
      {children}
    </CounselingShell>
  );
}
