import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUserFromToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { SuperAdminShell } from "@/components/super-admin/shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jobz_token")?.value;
  const auth = getAuthUserFromToken(token);

  if (!auth || auth.role !== "admin") redirect("/admin/login");

  await connectDB();
  const user = await User.findById(auth.userId).select("fullName email status role").lean();
  if (!user || user.role !== "admin" || user.status !== "active") redirect("/admin/login");

  return (
    <SuperAdminShell name={user.fullName || "Super Admin"} email={user.email || ""}>
      {children}
    </SuperAdminShell>
  );
}
