"use client";
import { use } from "react";
import { redirect } from "next/navigation";
import { DashboardPage } from "@/components/portal";
export default function Page({
  params,
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const p = use(params);
  // Super admin and counseling now have dedicated dashboards. The old shared
  // shell is retired for these roles.
  if (p.role === "admin") redirect("/admin/dashboard");
  if (p.role === "counseling") redirect("/counseling/dashboard");
  if (p.role === "job-seeker") {
    const map: Record<string, string> = {
      dashboard: "/profile",
      profile: "/profile/edit",
      resume: "/profile/resume",
      applications: "/profile/applications",
      "saved-jobs": "/profile/saved-jobs",
      interviews: "/profile/interviews",
      growth: "/profile/career-progress",
      notifications: "/profile/notifications",
      settings: "/profile/settings",
      jobs: "/jobs",
      "find-jobs": "/jobs",
    };
    redirect(map[p.section?.[0] || "dashboard"] || "/profile");
  }
  if (["employer", "company", "company-member"].includes(p.role)) redirect("/company/dashboard");
  return (
    <DashboardPage role={p.role} section={p.section?.[0] || "dashboard"} />
  );
}
