"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell, Bookmark, BriefcaseBusiness, ChartNoAxesCombined, FileText,
  LayoutDashboard, Menu, Pencil, Settings, UserRound, Users, X,
} from "lucide-react";

const NAV = [
  { label: "Profile Overview", href: "/profile", icon: LayoutDashboard },
  { label: "Edit Profile", href: "/profile/edit", icon: Pencil },
  { label: "Resume Management", href: "/profile/resume", icon: FileText },
  { label: "My Applications", href: "/profile/applications", icon: BriefcaseBusiness },
  { label: "Saved Jobs", href: "/profile/saved-jobs", icon: Bookmark },
  { label: "Interviews", href: "/profile/interviews", icon: Users },
  { label: "Career Progress", href: "/profile/career-progress", icon: ChartNoAxesCombined },
  { label: "Counseling Support", href: "/profile/counseling", icon: UserRound },
  { label: "Notifications", href: "/profile/notifications", icon: Bell },
  { label: "Settings", href: "/profile/settings", icon: Settings },
];

export function ProfileShell({ children, name }: { children: ReactNode; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = NAV.find((item) => item.href === pathname) || NAV[0];
  const ActiveIcon = active.icon;

  return <div className="min-h-[calc(100vh-64px)] bg-[#F7F9F8]">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-11">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#172B25] sm:text-3xl">My Profile</h1>
        <p className="mt-1 text-sm text-[#68776F] sm:text-base">Manage your profile, applications, interviews and career journey in one place.</p>
      </div>

      <div className="lg:hidden mb-4">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          className="flex w-full items-center justify-between rounded-xl border border-[#E4EBE7] bg-white px-4 py-3 text-sm font-semibold text-[#172B25]">
          <span className="flex items-center gap-2"><ActiveIcon size={16} className="text-[#16895C]" /> {active.label}</span>
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className={`${open ? "block" : "hidden"} lg:block`}>
          <nav aria-label="Profile navigation" className="sticky top-20 rounded-2xl border border-[#E4EBE7] bg-white p-2 shadow-[0_8px_30px_rgba(20,50,35,.04)]">
            {NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isActive ? "bg-[#EAF5F0] font-semibold text-[#16895C]" : "text-[#52635B] hover:bg-[#F4F8F6] hover:text-[#16895C]"}`}>
                <Icon size={16} className="shrink-0" />{item.label}
              </Link>;
            })}
          </nav>
          <div className="mt-4 hidden rounded-2xl border border-[#E4EBE7] bg-white p-4 text-xs leading-5 text-[#68776F] lg:block">
            Signed in as <b className="text-[#172B25]">{name}</b>. Your career workspace is private and protected.
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  </div>;
}
