import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUserFromToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Company from "@/models/Company";
import Notification from "@/models/Notification";
import { CompanyShell } from "@/components/company/shell";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const auth = getAuthUserFromToken(cookieStore.get("jobz_token")?.value);
  if (!auth || !["employer", "companyMember"].includes(auth.role)) redirect("/login");

  await connectDB();
  const user = await User.findById(auth.userId).select("fullName email status role companyId").lean();
  if (!user || user.status !== "active" || !user.companyId) redirect("/login");
  const company = await Company.findById(user.companyId).select("name status").lean();
  if (!company || company.status !== "active") redirect("/login");
  const unread = await Notification.countDocuments({ userId: user._id, read: false });

  return (
    <CompanyShell
      name={user.fullName || "Company User"}
      email={user.email || ""}
      company={company.name || "Your Company"}
      isAdmin={auth.role === "employer"}
      unread={unread}
    >
      {children}
    </CompanyShell>
  );
}
