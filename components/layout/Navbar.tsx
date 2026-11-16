"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Bell, BriefcaseBusiness, ChevronDown, Menu, X } from "lucide-react";

type Account = { fullName: string; role: string };
const links = [
  { label: "Home", href: "/" },
  { label: "Find Jobs", href: "/jobs", dropdown: true },
  { label: "Companies", href: "/companies", dropdown: true },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => { if (active && result?.user) setAccount({ fullName: result.user.fullName, role: result.user.role }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  const dashboard = account ? account.role === "jobSeeker" ? "/job-seeker/dashboard" : `/${account.role}/dashboard` : "/login";
  const notifications = account ? account.role === "jobSeeker" ? "/job-seeker/notifications" : `/${account.role}/notifications` : "/login";

  return <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
    <div className="mx-auto flex min-h-[54px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-11">
      <Link href="/" className="inline-flex shrink-0 items-center gap-2 text-[21px] font-bold tracking-[-.055em] text-[#111827]" aria-label="JobZ home">
        <span className="grid size-7 place-items-center rounded-md bg-[#16895C] text-white"><BriefcaseBusiness className="size-[17px]" strokeWidth={2.5} /></span>
        JobZ
      </Link>

      <nav aria-label="Main navigation" className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-[#E5E7EB] bg-white p-4 shadow-lg md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
        {links.map(({ label, href, dropdown }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`group relative flex min-h-10 items-center gap-1 px-2 text-[13px] font-semibold transition-colors hover:text-[#16895C] md:min-h-[54px] md:px-0 ${active ? "text-[#16895C]" : "text-[#111827]"}`}>
            {label}{dropdown && <ChevronDown className="size-3.5" />}
            {active && <span className="absolute bottom-0 left-2 right-2 hidden h-0.5 rounded-full bg-[#16895C] md:block md:left-0 md:right-0" />}
          </Link>;
        })}
        <div className="mt-2 flex items-center gap-2 border-t border-[#E5E7EB] pt-3 md:hidden">
          <Link href={account ? dashboard : "/login"} className="flex min-h-10 flex-1 items-center justify-center rounded-lg border border-[#CBD5E1] px-4 text-sm font-semibold text-[#111827]">{account ? "My workspace" : "Login"}</Link>
          {!account && <Link href="/register" className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white">Get Started <ArrowRight className="size-4" /></Link>}
        </div>
      </nav>

      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <Link href={notifications} aria-label="Notifications" className="relative grid size-9 place-items-center rounded-lg text-[#111827] hover:bg-[#F1F5F9]"><Bell className="size-[18px]" />{account && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />}</Link>
        {account ? <>
          <span className="max-w-28 truncate text-xs text-[#475569]">{account.fullName}</span>
          <Link href={dashboard} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#16895C] px-4 text-xs font-semibold text-white hover:bg-[#328A66]">Workspace <ArrowRight className="size-3.5" /></Link>
        </> : <>
          <Link href="/login" className="inline-flex min-h-9 items-center rounded-lg border border-[#CBD5E1] px-4 text-xs font-semibold text-[#111827] transition-colors hover:border-[#16895C] hover:text-[#16895C]">Login</Link>
          <Link href="/register" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#16895C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#328A66]">Get Started</Link>
        </>}
      </div>

      <button type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid size-9 place-items-center rounded-lg border border-[#E5E7EB] text-[#111827] md:hidden">
        {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>
    </div>
  </header>;
}
