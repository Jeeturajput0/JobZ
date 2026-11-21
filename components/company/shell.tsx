"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell, BookmarkCheck, BriefcaseBusiness, Building2, CalendarDays, ChartNoAxesCombined,
  ClipboardList, FileCheck2, Handshake, LayoutDashboard, LogOut, Menu, Plus, Search,
  Settings, UserCog, Users, X,
} from "lucide-react";

type Item = { label: string; href: string; icon: typeof LayoutDashboard; adminOnly?: boolean };

const NAV: Item[] = [
  { label: "Overview", href: "/company/dashboard", icon: LayoutDashboard },
  { label: "Company Profile", href: "/company/profile", icon: Building2, adminOnly: true },
  { label: "Team Management", href: "/company/team", icon: UserCog, adminOnly: true },
  { label: "All Jobs", href: "/company/jobs", icon: BriefcaseBusiness },
  { label: "Create Job", href: "/company/jobs/new", icon: Plus },
  { label: "Applicants", href: "/company/applicants", icon: Users },
  { label: "Recruitment Pipeline", href: "/company/pipeline", icon: ClipboardList },
  { label: "Interviews", href: "/company/interviews", icon: CalendarDays },
  { label: "Hiring Requests", href: "/company/hiring-requests", icon: FileCheck2 },
  { label: "Counseling Partners", href: "/company/partnerships", icon: Handshake, adminOnly: true },
  { label: "Recommendations", href: "/company/recommendations", icon: BookmarkCheck },
  { label: "Placements", href: "/company/placements", icon: BriefcaseBusiness },
  { label: "Recruitment Analytics", href: "/company/analytics", icon: ChartNoAxesCombined },
  { label: "Notifications", href: "/company/notifications", icon: Bell },
  { label: "Settings", href: "/company/settings", icon: Settings, adminOnly: true },
];

export function CompanyShell({ children, name, email, company, isAdmin, unread }: {
  children: ReactNode; name: string; email: string; company: string; isAdmin: boolean; unread?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/company/applicants?search=${encodeURIComponent(query.trim())}`);
  }

  const items = NAV.filter((i) => !i.adminOnly || isAdmin);
  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#172B25]">
      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#E5ECE8] bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-[#EDF1EF] px-5 py-4">
          <Link href="/company/dashboard" className="flex items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-[#3FA47B] text-lg text-white">j</span>
            jobz<span className="-ml-1.5 text-[#3FA47B]">.</span>
            <span className="ml-1 rounded bg-[#EAF5F0] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#267653]">Hiring</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mx-3 mt-4 rounded-lg bg-[#F4F8F6] px-3 py-2">
          <p className="truncate text-xs font-semibold text-[#34455D]">{company || "Your Company"}</p>
          <p className="truncate text-[10px] text-[#8A98A5]">{isAdmin ? "Company admin" : "Team member"}</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/company/dashboard" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${active ? "bg-[#EAF5F0] font-semibold text-[#267653]" : "text-[#52627A] hover:bg-[#F4F8F6] hover:text-[#267653]"}`}>
                <Icon size={16} className="shrink-0" /><span className="truncate">{item.label}</span>
                {item.label === "Notifications" && Boolean(unread) && <span className="ml-auto rounded-full bg-[#3FA47B] px-1.5 text-[10px] text-white">{unread}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#EDF1EF] p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#F7F9F8] px-2.5 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EAF5F0] text-xs font-bold text-[#267653]">{(name || "C")[0]}</span>
            <span className="min-w-0">
              <b className="block truncate text-xs text-[#34455D]">{name}</b>
              <small className="block truncate text-[10px] text-[#8A98A5]">{email}</small>
            </span>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[#71817A] hover:bg-[#FDEDE9] hover:text-[#B25238]"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E5ECE8] bg-white px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <form onSubmit={onSearch} className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-[#E5ECE8] px-3 py-1.5">
            <Search size={15} className="text-[#93A09A]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applicants…" className="w-full bg-transparent text-[13px] outline-none" />
          </form>
          <span className="ml-auto hidden text-xs text-[#8A98A5] sm:block">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          <Link href="/company/notifications" aria-label="Notifications" className="relative text-[#52627A]">
            <Bell size={18} />
            {Boolean(unread) && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#3FA47B] text-[9px] text-white">{unread}</span>}
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
