
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";

const groups = [
  {
    title: "For Job Seekers",
    description: "Take the next step in your career.",
    links: [
      ["Explore Jobs", "/jobs"],
      ["Discover Companies", "/companies"],
      ["Create Your Profile", "/register"],
      ["Help & Support", "/contact"],
    ],
  },
  {
    title: "For Employers",
    description: "Find the right talent for your team.",
    links: [
      ["Post a Job", "/company/jobs/new"],
      ["Manage Job Listings", "/company/jobs"],
      ["Employer Login", "/login"],
      ["Contact Our Team", "/contact"],
    ],
  },
  {
    title: "About JobZ",
    description: "Learn more about our platform.",
    links: [
      ["About Us", "/about"],
      ["Contact Us", "/contact"],
      ["Admin Login", "/admin/login"],
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const socials = [
    ["LinkedIn", "LI", process.env.NEXT_PUBLIC_LINKEDIN_URL],
    ["Twitter", "X", process.env.NEXT_PUBLIC_TWITTER_URL],
    ["Facebook", "f", process.env.NEXT_PUBLIC_FACEBOOK_URL],
    ["YouTube", "▶", process.env.NEXT_PUBLIC_YOUTUBE_URL],
  ].filter(([, , href]) => Boolean(href)) as [string, string, string][];

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to subscribe. Please try again.");
      }

      setMessage(result.message || "Thanks for subscribing to JobZ!");
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-9 px-5 py-12 sm:px-8 md:grid-cols-[1.35fr_.8fr_.8fr_.8fr_1.45fr] md:gap-y-7 lg:px-11">

        {/* Brand */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-[-.055em] text-[#111827]"
          >
            <span className="grid size-8 place-items-center rounded-md bg-[#16895C] text-white">
              <BriefcaseBusiness className="size-[19px]" strokeWidth={2.5} />
            </span>
            JobZ
          </Link>

          <p className="mt-3 max-w-[240px] text-sm leading-6 text-[#475569]">
            Your next opportunity starts here. Discover jobs, connect with
            great companies, and build a career you&apos;re proud of.
          </p>

          {socials.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              {socials.map(([label, mark, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-8 place-items-center rounded-full text-xs font-bold text-[#334155] transition-colors hover:bg-[#EAF5F0] hover:text-[#167B55]"
                >
                  {mark}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        {groups.map((group) => (
          <nav
            key={group.title}
            aria-label={group.title}
            className="grid content-start gap-2.5"
          >
            <h2 className=" font-semibold text-[#111827]">
              {group.title}
            </h2>

            <p className="mb-1 text-[13px] leading-5 text-[#2e3238]">
              {group.description}
            </p>

            {group.links.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="w-fit text-[13px] text-[#475569] transition-colors hover:text-[#167B55]"
              >
                {label}
              </Link>
            ))}
          </nav>
        ))}

        {/* Newsletter */}
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">
            Stay Connected
          </h2>

          <p className="mt-2 text-[13px] leading-5 text-[#64748B]">
            Get the latest job opportunities, career tips, and JobZ updates
            delivered straight to your inbox.
          </p>

          <form
            onSubmit={subscribe}
            className="mt-4 flex min-h-10 overflow-hidden rounded-lg border border-[#CBD5E1] focus-within:border-[#16895C]"
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Your email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="min-w-0 flex-1 px-3 text-[13px] text-[#111827] outline-none placeholder:text-[#64748B]"
            />

            <button
              type="submit"
              disabled={busy}
              aria-label="Subscribe to JobZ updates"
              className="inline-flex shrink-0 items-center justify-center gap-1 bg-[#16895C] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#328A66] disabled:opacity-60"
            >
              {busy ? "Saving..." : "Subscribe"}
              <ArrowRight className="size-3.5" />
            </button>
          </form>

          {message && (
            <p role="status" className="mt-2 text-xs text-[#167B55]">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-[#E5E7EB]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5  text-[#64748B] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-11">

          <span>
            © {new Date().getFullYear()} JobZ. All rights reserved.
          </span>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/privacy-policy" className="transition-colors hover:text-[#167B55]">
              Privacy Policy
            </Link>

            <span aria-hidden="true">|</span>

            <Link href="/terms" className="transition-colors hover:text-[#167B55]">
              Terms & Conditions
            </Link>

            <span aria-hidden="true">|</span>

            <Link href="/contact" className="transition-colors hover:text-[#167B55]">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
