"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Bell, Bookmark, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown,
  FileText, LayoutDashboard, LogOut, Menu, Pencil, Settings, UserRound, Users, X,
} from "lucide-react";

type Account = {
  fullName: string;
  role: "jobSeeker" | "employer" | "companyMember" | "counselingAdmin" | "counselingMember" | "admin";
  username?: string;
  profileImage?: string | null;
  companyLogo?: string | null;
  dashboard?: string;
};

const links = [
  { label: "Home", href: "/" },
  { label: "Find Jobs", href: "/jobs", dropdown: true },
  { label: "Companies", href: "/companies", dropdown: true },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const PROFILE_MENU = [
  { label: "My Profile", href: "/profile", icon: LayoutDashboard },
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

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => { if (active && result?.user) setAccount(result.user); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => setProfileOpen(false), [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  async function logout() {
    setProfileOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const isJobSeeker = account?.role === "jobSeeker";
  const dashboard = account?.dashboard || (account ? `/${account.role}/dashboard` : "/login");
  const notifications = isJobSeeker ? "/profile/notifications" : account ? "/notifications" : "/login";
  const profileUrl = account?.username ? `/profile/${account.username}` : "/profile";
  const profileImage = account?.role === "employer" ? account.companyLogo : account?.profileImage;
  const initials = account?.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "J";
  const roleLabel = isJobSeeker ? "Job Seeker" : account?.role === "employer" ? "Employer" : account?.role === "admin" ? "Admin" : "Team";

  return <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
    <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-11">
      <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 text-[23px] font-bold tracking-[-.055em] text-[#111827]" aria-label="JobZ home">
        <span className="grid size-8 place-items-center rounded-md bg-[#16895C] text-white"><BriefcaseBusiness className="size-[19px]" strokeWidth={2.5} /></span>
        JobZ
      </Link>

      <nav aria-label="Main navigation" className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-[#E5E7EB] bg-white p-4 shadow-lg md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
        {links.map(({ label, href, dropdown }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group relative flex min-h-11 items-center gap-1 px-2 text-sm font-semibold transition-colors hover:text-[#16895C] md:min-h-[64px] md:px-0 ${active ? "text-[#16895C]" : "text-[#111827]"}`}>
            {label}{dropdown && <ChevronDown className="size-3.5" />}
            {active && <span className="absolute bottom-0 left-2 right-2 hidden h-0.5 rounded-full bg-[#16895C] md:block md:left-0 md:right-0" />}
          </Link>;
        })}
        <div className="mt-2 flex flex-col gap-2 border-t border-[#E5E7EB] pt-3 md:hidden">
          {account ? <>
            {isJobSeeker && <div className="grid grid-cols-2 gap-1">
              {PROFILE_MENU.map((item) => {
                const Icon = item.icon;
                return <Link key={item.href} href={item.href} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-medium text-[#34455D] hover:bg-[#F4F8F6]"><Icon size={14} className="text-[#16895C]" />{item.label}</Link>;
              })}
            </div>}
            {!isJobSeeker && account.role !== "admin" && <Link href={profileUrl} className="flex min-h-14 items-center gap-3 rounded-xl px-2 hover:bg-[#F5FAF7]">
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF5F0] text-sm font-bold text-[#16895C]">{profileImage ? <img src={profileImage} alt="" className="size-full object-cover" /> : initials}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#172B25]">{account.fullName}</span><span className="block text-xs text-[#64746B]">{roleLabel}</span></span>
            </Link>}
            <Link href={dashboard} className="flex min-h-11 items-center justify-center gap-1 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white">My workspace <ArrowRight className="size-4" /></Link>
            <button type="button" onClick={logout} className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-[#E5E7EB] text-sm font-semibold text-[#B25238]"><LogOut size={15} /> Logout</button>
          </> : <div className="flex items-center gap-2"><Link href="/login" className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#CBD5E1] px-4 text-sm font-semibold text-[#111827]">Login</Link><Link href="/register" className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white">Get Started <ArrowRight className="size-4" /></Link></div>}
        </div>
      </nav>

      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <Link href={notifications} aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg text-[#111827] hover:bg-[#F1F5F9]"><Bell className="size-[18px]" />{account && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />}</Link>
        {account ? <>
          {isJobSeeker ? (
            <div className="relative" ref={dropdownRef}>
              <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-haspopup="menu" aria-expanded={profileOpen}
                className="flex min-h-10 max-w-56 items-center gap-2 rounded-xl border border-[#E4EBE7] bg-white px-2 transition-colors hover:border-[#16895C] hover:bg-[#F7FBF9]">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF5F0] text-xs font-bold text-[#16895C]">{profileImage ? <img src={profileImage} alt="" className="size-full object-cover" /> : initials}</span>
                <span className="min-w-0 text-left"><span className="block truncate text-[13px] font-semibold leading-4 text-[#172B25]">{account.fullName}</span><span className="block text-[10px] text-[#64746B]">Job Seeker</span></span>
                <ChevronDown size={14} className={`shrink-0 text-[#64746B] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-[0_18px_45px_rgba(20,50,35,.14)] transition-all">
                <div className="border-b border-[#EDF2EF] bg-[#F7FBF9] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#172B25]">{account.fullName}</p>
                  <p className="truncate text-xs text-[#64746B]">{account.username ? `@${account.username}` : "Job Seeker"}</p>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-1.5">
                  {PROFILE_MENU.map((item) => {
                    const Icon = item.icon;
                    return <Link key={item.href} href={item.href} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#34455D] hover:bg-[#F1F7F4] hover:text-[#16895C]"><Icon size={15} className="text-[#16895C]" />{item.label}</Link>;
                  })}
                  <button type="button" role="menuitem" onClick={logout} className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-[#EDF2EF] px-3 py-2.5 text-left text-[13px] font-semibold text-[#B25238] hover:bg-[#FDEDE9]"><LogOut size={15} /> Logout</button>
                </div>
              </div>}
            </div>
          ) : <>
            {account.role !== "admin" && <Link href={profileUrl} aria-label={`${account.fullName}, ${roleLabel} public profile`} className="flex min-h-10 max-w-48 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-[#F1F5F9]">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#EAF5F0] text-xs font-bold text-[#16895C]">{profileImage ? <img src={profileImage} alt="" className="size-full object-cover" /> : initials}</span>
              <span className="min-w-0 text-left"><span className="block truncate text-[13px] font-semibold leading-4 text-[#172B25]">{account.fullName}</span></span>
            </Link>}
            <Link href={dashboard} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#16895C] px-4 text-[13px] font-semibold text-white hover:bg-[#328A66]">Workspace <ArrowRight className="size-3.5" /></Link>
          </>}
        </> : <>
          <Link href="/login" className="inline-flex min-h-10 items-center rounded-lg border border-[#CBD5E1] px-4 text-[13px] font-semibold text-[#111827] transition-colors hover:border-[#16895C] hover:text-[#16895C]">Login</Link>
          <Link href="/register" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#16895C] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#328A66]">Get Started</Link>
        </>}
      </div>
      <button type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-lg border border-[#E5E7EB] text-[#111827] md:hidden">
        {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
      </button>
    </div>
  </header>;
}
