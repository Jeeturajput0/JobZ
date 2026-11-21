"use client";
import { use } from "react";
import { redirect } from "next/navigation";

export default function Page({
  params,
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const p = use(params);
  const map: Record<string, string> = {
    "job-seeker": "/profile",
    employer: "/company/dashboard",
    company: "/company/dashboard",
    "company-member": "/company/dashboard",
    counseling: "/counseling/dashboard",
    "counseling-admin": "/counseling/dashboard",
    "counseling-member": "/counseling/dashboard",
    admin: "/admin/dashboard",
    dashboard: "/profile",
    profile: "/profile/edit",
    "find-jobs": "/jobs",
    jobs: "/jobs",
    applications: "/profile/applications",
    "saved-jobs": "/profile/saved-jobs",
    interviews: "/profile/interviews",
    growth: "/profile/career-progress",
    notifications: "/profile/notifications",
    settings: "/profile/settings",
    resume: "/profile/resume",
  };
  redirect(map[p.role] || "/");
}
