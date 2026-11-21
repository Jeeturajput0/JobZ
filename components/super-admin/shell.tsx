"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity, BriefcaseBusiness, Building2, CheckCircle2, ClipboardList,
  FileCheck2, GraduationCap, Handshake, LayoutDashboard, LogOut, Menu,
  Plus, ScrollText, Settings, ShieldCheck, UserCog, Users, X,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }] },
  {
    label: "Companies",
    items: [
      { label: "All Companies", href: "/admin/companies", icon: Building2 },
      { label: "Add Company", href: "/admin/companies/add", icon: Plus },
      { label: "Company Verification", href: "/admin/companies/verification", icon: FileCheck2 },
      { label: "Company Team Members", href: "/admin/company-members", icon: Users },
    ],
  },
  {
    label: "Counseling Organizations",
    items: [
      { label: "All Organizations", href: "/admin/counseling", icon: GraduationCap },
      { label: "Add Organization", href: "/admin/counseling/add", icon: Plus },
      { label: "Counseling Team Members", href: "/admin/counseling-members", icon: UserCog },
      { label: "Counseling Overview", href: "/admin/counseling-overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Job Seekers",
    items: [
      { label: "All Job Seekers", href: "/admin/seekers", icon: Users },
      { label: "Candidate Profiles", href: "/admin/seekers/profiles", icon: ClipboardList },
      { label: "Candidate Verification", href: "/admin/seekers/verification", icon: FileCheck2 },
    ],
  },
  {
    label: "Jobs",
    items: [
      { label: "All Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
      { label: "Pending Jobs", href: "/admin/jobs/pending", icon: ClipboardList },
      { label: "Active Jobs", href: "/admin/jobs/active", icon: CheckCircle2 },
      { label: "Rejected Jobs", href: "/admin/jobs/rejected", icon: X },
    ],
  },
  {
    label: "Applications",
    items: [
      { label: "All Applications", href: "/admin/applications", icon: ScrollText },
      { label: "Application Overview", href: "/admin/applications/overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Partnerships",
    items: [
      { label: "All Partnerships", href: "/admin/partnerships", icon: Handshake },
      { label: "Pending Requests", href: "/admin/partnerships/pending", icon: ClipboardList },
      { label: "Active Partnerships", href: "/admin/partnerships/active", icon: CheckCircle2 },
    ],
  },
  { label: "Placements", items: [{ label: "Placement Records", href: "/admin/placements", icon: BriefcaseBusiness }] },
  {
    label: "Team & Access",
    items: [
      { label: "Super Admin Members", href: "/admin/admins", icon: ShieldCheck },
      { label: "Roles & Permissions", href: "/admin/roles", icon: UserCog },
    ],
  },
  { label: "Settings", items: [{ label: "Platform Settings", href: "/admin/settings", icon: Settings }] },
  { label: "Activity", items: [{ label: "Platform Activity Logs", href: "/admin/activity", icon: Activity }] },
];

export function SuperAdminShell({ children, name, email }: { children: ReactNode; name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#172B25]">
      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#E5ECE8] bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#EDF1EF] px-5 py-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-[21px] font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-[#3FA47B] text-lg text-white">j</span>
            jobz<span className="-ml-1.5 text-[#3FA47B]">.</span>
            <span className="ml-1 rounded bg-[#EAF5F0] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#267653]">Admin</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#93A09A]">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${active ? "bg-[#EAF5F0] font-semibold text-[#267653]" : "text-[#52627A] hover:bg-[#F4F8F6] hover:text-[#267653]"}`}>
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#EDF1EF] p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#F7F9F8] px-2.5 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EAF5F0] text-xs font-bold text-[#267653]">{(name || "A")[0]}</span>
            <span className="min-w-0">
              <b className="block truncate text-xs text-[#34455D]">{name}</b>
              <small className="block truncate text-[10px] text-[#8A98A5]">{email}</small>
            </span>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[#71817A] hover:bg-[#FDEDE9] hover:text-[#B25238]">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E5ECE8] bg-white px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <span className="text-sm font-medium text-[#71817A]">Super Admin Workspace</span>
          <span className="ml-auto hidden text-xs text-[#8A98A5] sm:block">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
