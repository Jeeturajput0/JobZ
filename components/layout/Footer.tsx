"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Facebook, Linkedin, Twitter, Youtube } from "lucide-react";

const groups = [
  { title: "For Candidates", links: [["Find Jobs", "/jobs"], ["Browse Companies", "/companies"], ["Create Profile", "/register"], ["Help & Contact", "/contact"]] },
  { title: "For Employers", links: [["Post a Job", "/employer/post-job"], ["Manage Jobs", "/employer/dashboard"], ["Employer Login", "/login"], ["Contact Sales", "/contact"]] },
  { title: "Company", links: [["About Us", "/about"], ["Contact Us", "/contact"], ["Admin Login", "/admin/login"]] },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const socials = [
    ["LinkedIn", process.env.NEXT_PUBLIC_LINKEDIN_URL, Linkedin],
    ["Twitter", process.env.NEXT_PUBLIC_TWITTER_URL, Twitter],
    ["Facebook", process.env.NEXT_PUBLIC_FACEBOOK_URL, Facebook],
    ["YouTube", process.env.NEXT_PUBLIC_YOUTUBE_URL, Youtube],
  ].filter(([, href]) => Boolean(href)) as [string, string, typeof Linkedin][];

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save your subscription.");
      setMessage(result.message || "Your subscription has been saved.");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your subscription.");
    } finally {
      setBusy(false);
    }
  }

  return <footer className="border-t border-[#E5E7EB] bg-white">
    <div className="mx-auto grid max-w-7xl gap-x-7 gap-y-8 px-5 py-8 sm:px-8 md:grid-cols-[1.35fr_.8fr_.8fr_.8fr_1.45fr] md:gap-y-6 lg:px-11">
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-[21px] font-bold tracking-[-.055em] text-[#111827]">
          <span className="grid size-7 place-items-center rounded-md bg-[#16895C] text-white"><BriefcaseBusiness className="size-[17px]" strokeWidth={2.5} /></span>JobZ
        </Link>
        <p className="mt-2 max-w-[220px] text-[11px] leading-[1.55] text-[#334155]">Connecting talent with opportunities.<br />Build your career with JobZ.</p>
        {socials.length > 0 && <div className="mt-3 flex items-center gap-2.5">{socials.map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-7 place-items-center rounded-full text-[#111827] transition-colors hover:bg-[#EAF5F0] hover:text-[#167B55]"><Icon className="size-4" /></a>)}</div>}
      </div>

      {groups.map((group) => <nav key={group.title} aria-label={group.title} className="grid content-start gap-2">
        <h2 className="mb-0.5 text-xs font-semibold text-[#111827]">{group.title}</h2>
        {group.links.map(([label, href]) => <Link key={label} href={href} className="w-fit text-[11px] text-[#334155] transition-colors hover:text-[#167B55]">{label}</Link>)}
      </nav>)}

      <div>
        <h2 className="text-xs font-semibold text-[#111827]">Get JobZ updates</h2>
        <p className="mt-1 text-[11px] leading-5 text-[#475569]">Hear about new opportunities and product updates.</p>
        <form onSubmit={subscribe} className="mt-2 flex min-h-9 overflow-hidden rounded-lg border border-[#CBD5E1] focus-within:border-[#16895C]">
          <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
          <input id="newsletter-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="min-w-0 flex-1 px-3 text-[11px] text-[#111827] outline-none placeholder:text-[#64748B]" />
          <button type="submit" disabled={busy} aria-label="Subscribe to JobZ updates" className="inline-flex shrink-0 items-center justify-center gap-1 bg-[#16895C] px-3 text-[11px] font-semibold text-white hover:bg-[#328A66] disabled:opacity-60">{busy ? "Saving…" : "Subscribe"}<ArrowRight className="size-3.5" /></button>
        </form>
        {message && <p role="status" className="mt-1.5 text-[10px] text-[#167B55]">{message}</p>}
      </div>
    </div>
    <div className="border-t border-[#E5E7EB]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-3 text-[10px] text-[#475569] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-11">
        <span>© {new Date().getFullYear()} JobZ. All rights reserved.</span>
        <div className="flex items-center gap-2"><span>Privacy Policy</span><span aria-hidden="true">|</span><span>Terms of Service</span><span aria-hidden="true">|</span><Link href="/contact" className="hover:text-[#167B55]">Contact</Link></div>
      </div>
    </div>
  </footer>;
}
