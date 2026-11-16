"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Bookmark, BriefcaseBusiness, Building2, Calculator, Database, Flame, HardHat, Laptop, MapPin, Megaphone, Monitor, PenTool, Rocket, Search, ShieldCheck, Sprout, TrendingUp, Users } from "lucide-react";
import type { Job } from "@/data/jobs";
import { useJobZ } from "@/components/provider";

export type HomeCategory = { id: string; name: string; slug: string; count: number };
export type HomeCompany = { id: string; name: string; logo: string; industry: string; location: string; companySize: string; description: string; jobCount: number };
export type HomeSkill = { name: string; jobs: number };

const categoryIcons = [Laptop, Megaphone, PenTool, TrendingUp, Database, Calculator, Users, HardHat];

function CompanyMark({ company, compact = false }: { company: Pick<HomeCompany, "name" | "logo">; compact?: boolean }) {
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-[#167B55] ${compact ? "size-11" : "size-14"}`}>
    {company.logo ? <img src={company.logo} alt={`${company.name} logo`} className="size-full object-contain p-1.5" /> : <span className="text-xl font-bold">{company.name.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

export function HomeHero({ skills }: { skills: HomeSkill[] }) {
  return <section className="relative mx-auto grid min-h-[340px] max-w-7xl items-center overflow-hidden px-5 pb-7 pt-8 sm:px-8 lg:min-h-[344px] lg:grid-cols-[1.12fr_.88fr] lg:gap-4 lg:px-11 lg:py-0">
    <div className="relative z-20 max-w-[590px] py-3 lg:py-7">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF5F0] px-4 py-2 text-xs font-medium text-[#172B25] sm:text-sm">
        <span className="size-2 rounded-full bg-[#3FA47B]" />A better way to work
      </div>
      <h1 className="mt-4 max-w-[570px] text-[clamp(2.75rem,6.3vw,3.55rem)] font-semibold leading-[.99] tracking-[-.055em] text-[#111827]">
        Find work that<br className="hidden sm:block" /> works <span className="font-serif font-semibold italic tracking-[-.045em] text-[#218B5E]">for you.</span>
      </h1>
      <p className="mt-3 max-w-[475px] text-[15px] leading-6 text-[#475569] sm:text-base">Discover meaningful opportunities at companies that value what you bring.</p>

      <form action="/jobs" method="get" className="mt-4 flex max-w-[555px] flex-wrap items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-[0_5px_18px_rgba(17,24,39,.07)] sm:flex-nowrap">
        <label className="flex min-h-10 min-w-[190px] flex-1 items-center gap-2.5 px-2.5 text-[#111827]">
          <Search className="size-4 shrink-0" />
          <span className="sr-only">Search jobs</span>
          <input name="q" placeholder="Search jobs (e.g. React Developer)" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#64748B] sm:text-[13px]" />
        </label>
        <span className="hidden h-7 w-px bg-[#E5E7EB] sm:block" />
        <label className="flex min-h-10 min-w-[125px] flex-1 items-center gap-2.5 border-t border-[#F1F5F9] px-2.5 text-[#111827] sm:border-0">
          <MapPin className="size-4 shrink-0" />
          <span className="sr-only">Location</span>
          <input name="location" placeholder="Location" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#64748B] sm:text-[13px]" />
        </label>
        <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#328A66] sm:w-auto">Search Jobs <ArrowRight className="size-4" /></button>
      </form>

      {skills.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] sm:text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#172B25]"><Flame className="size-3.5 fill-orange-500 text-orange-500" /> Trending:</span>
        {skills.slice(0, 5).map((skill) => <Link key={skill.name} href={`/jobs?q=${encodeURIComponent(skill.name)}`} className="font-medium text-[#176D4C] hover:text-[#328A66]">{skill.name}</Link>)}
      </div>}
    </div>

    <div className="relative hidden h-full min-h-[330px] lg:block">
      <div className="absolute bottom-0 left-[6%] h-[278px] w-[74%] rotate-[-7deg] rounded-[36px] bg-gradient-to-br from-[#DEF4E9] via-[#EAF5F0] to-[#F7FCF9]" />
      <svg aria-hidden="true" viewBox="0 0 74 60" className="absolute left-[10%] top-[15%] h-14 w-16 text-[#16895C]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 6l8 14M5 25l15 4M21 40l-4 12" /></svg>
      <Image src="/images/jobz-hero-candidate.png" alt="Smiling professional holding a laptop" width={1080} height={1440} priority className="absolute bottom-0 left-[48%] z-10 h-[103%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom" />
      <div className="absolute right-[1%] top-[21%] z-20 rotate-[-5deg] font-serif text-[21px] italic leading-[1.12] text-[#111827]">
        Build your<br />career with<br /><span className="text-[#167B55]">JobZ</span>
        <svg aria-hidden="true" viewBox="0 0 120 22" className="mt-1 h-5 w-28 text-[#167B55]" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c18 14 16-14 27-9 9 4-1 16 12 14C64 15 75 3 118 2" /></svg>
      </div>
    </div>
    <div className="relative mx-auto mt-3 h-[285px] w-full max-w-[440px] lg:hidden">
      <div className="absolute bottom-0 left-[9%] h-[240px] w-[80%] rotate-[-6deg] rounded-[36px] bg-[#EAF5F0]" />
      <Image src="/images/jobz-hero-candidate.png" alt="Smiling professional holding a laptop" width={1080} height={1440} priority className="absolute bottom-0 left-1/2 z-10 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom" />
      <span className="absolute right-0 top-8 z-20 rotate-[-6deg] font-serif text-lg italic leading-tight text-[#167B55]">Build your<br />career with JobZ</span>
    </div>
  </section>;
}

export function TrustedCompanies({ companies }: { companies: HomeCompany[] }) {
  return <section aria-label="Companies hiring on JobZ" className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-11">
    <div className="grid min-h-[58px] grid-cols-2 items-center gap-y-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(17,24,39,.05)] sm:grid-cols-[145px_repeat(3,minmax(0,1fr))] lg:grid-cols-[155px_repeat(6,minmax(0,1fr))]">
      <p className="row-span-2 border-r border-[#E5E7EB] pr-4 text-xs font-semibold leading-4 text-[#111827] sm:row-span-1">Trusted by<br className="hidden sm:block" /> leading companies:</p>
      {companies.slice(0, 6).map((company) => <div key={company.id} className="flex min-w-0 items-center justify-center gap-2 px-1 text-center text-sm font-semibold tracking-tight text-[#475569] sm:text-base">
        {company.logo ? <img src={company.logo} alt="" className="size-7 shrink-0 object-contain" /> : null}
        <span className="truncate">{company.name}</span>
      </div>)}
      {companies.length === 0 && <p className="col-span-2 text-xs text-[#64748B] sm:col-span-3 lg:col-span-6">Employer profiles will appear here as companies join JobZ.</p>}
    </div>
  </section>;
}

function SectionHeading({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return <div className="mb-4 flex items-end justify-between gap-3">
    <div><p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#167B55]"><span className="h-0.5 w-6 bg-[#3FA47B]" />{eyebrow}</p><h2 className="text-xl font-semibold tracking-[-.035em] text-[#111827] sm:text-[22px]">{title}</h2></div>
    {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#176D4C] hover:text-[#328A66]">{linkText || "View all"}<ArrowRight className="size-3.5" /></Link>}
  </div>;
}

export function CategoriesSection({ categories }: { categories: HomeCategory[] }) {
  return <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-11">
    <SectionHeading eyebrow="Popular categories" title="Explore top job categories" href="/jobs" linkText="View all categories" />
    {categories.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {categories.slice(0, 8).map((category, index) => {
        const CategoryIcon = categoryIcons[index % categoryIcons.length];
        return <Link key={category.id} href={`/jobs?category=${encodeURIComponent(category.name)}`} className="group flex min-h-[60px] items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 shadow-[0_2px_8px_rgba(17,24,39,.035)] transition-all hover:-translate-y-0.5 hover:border-[#B7DCCA] hover:shadow-md">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#EAF5F0] text-[#167B55]"><CategoryIcon className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#111827]">{category.name}</span><span className="mt-0.5 block text-[11px] text-[#64748B]">{category.count.toLocaleString()} {category.count === 1 ? "job" : "jobs"}</span></span>
          <ArrowRight className="size-4 shrink-0 text-[#111827] transition-transform group-hover:translate-x-0.5" />
        </Link>;
      })}
    </div> : <EmptyInline message="Job categories will appear here when they have been added." />}
  </section>;
}

export function FeaturedJobCard({ job }: { job: Job }) {
  const { saved, toggleSave, apply } = useJobZ();
  const brand = { name: job.company, logo: job.logoUrl || "" };
  return <article className="flex min-h-[180px] flex-col rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-[0_3px_11px_rgba(17,24,39,.06)] transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-4">
    <div className="flex items-start justify-between gap-2">
      <CompanyMark company={brand} compact />
      <button type="button" aria-label={saved.includes(job.id) ? "Remove saved job" : "Save job"} aria-pressed={saved.includes(job.id)} onClick={() => toggleSave(job.id)} className="rounded-md p-1.5 text-[#111827] hover:bg-[#EAF5F0] hover:text-[#167B55]"><Bookmark className="size-5" fill={saved.includes(job.id) ? "currentColor" : "none"} /></button>
    </div>
    <Link href={`/jobs/${job.id}`} className="mt-2 text-[14px] font-semibold leading-5 tracking-[-.02em] text-[#111827] hover:text-[#167B55]">{job.title}</Link>
    <p className="text-xs text-[#475569]">{job.company}</p>
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#334155] sm:text-[11px]">
      <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
      <span className="inline-flex items-center gap-1"><BriefcaseBusiness className="size-3" />{job.type}</span>
      <span>{job.mode}</span>
      <span className="inline-flex items-center gap-1">◷ {job.salary}</span>
    </div>
    <div className="mt-2 flex min-h-5 flex-wrap gap-1.5">
      {(job.skills || []).slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[9px] font-medium text-[#334155]">{skill}</span>)}
      {!(job.skills || []).length && <><span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[9px] text-[#334155]">{job.mode}</span><span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[9px] text-[#334155]">{job.category}</span></>}
    </div>
    <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#F1F5F9] pt-2.5">
      <span className="text-[10px] text-[#475569]">Posted {job.posted.toLowerCase()}</span>
      <button type="button" onClick={() => apply(job)} className="inline-flex min-h-8 items-center rounded-lg bg-[#16895C] px-3 text-[11px] font-semibold text-white hover:bg-[#328A66]">Apply Now</button>
    </div>
  </article>;
}

export function FeaturedJobs({ jobs, loading, error }: { jobs: Job[]; loading: boolean; error: string | null }) {
  return <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-11">
    <SectionHeading eyebrow="Featured jobs" title="Handpicked opportunities for you" href="/jobs" linkText="View all jobs" />
    {loading ? <JobCardSkeleton /> : error ? <EmptyInline message="Job listings are temporarily unavailable." /> : jobs.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{jobs.slice(0, 3).map((job) => <FeaturedJobCard key={job.id} job={job} />)}</div> : <EmptyInline message="New job openings will appear here as employers publish them." />}
  </section>;
}

export function TopCompanies({ companies, loading, error }: { companies: HomeCompany[]; loading: boolean; error: boolean }) {
  return <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-11">
    <SectionHeading eyebrow="Top companies" title="Explore career opportunities at top companies" href="/companies" linkText="View all companies" />
    {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />)}</div> : error ? <EmptyInline message="Company profiles are temporarily unavailable." /> : companies.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {companies.slice(0, 6).map((company) => <Link key={company.id} href={`/companies/${company.id}`} className="flex min-h-[94px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-2 py-3 text-center shadow-[0_3px_10px_rgba(17,24,39,.055)] transition-all hover:-translate-y-0.5 hover:border-[#B7DCCA] hover:shadow-md">
        <CompanyMark company={company} compact />
        <span className="max-w-full truncate text-xs font-semibold text-[#111827]">{company.name}</span>
        <span className="text-[10px] text-[#64748B]">{company.jobCount.toLocaleString()} {company.jobCount === 1 ? "job" : "jobs"}</span>
      </Link>)}
    </div> : <EmptyInline message="Company profiles will appear here as employers join JobZ." />}
  </section>;
}

export function WhyChooseJobZ() {
  const benefits = [
    { title: "Fast & Easy", description: "Find jobs in minutes with powerful search.", icon: Rocket },
    { title: "Trusted Platform", description: "Your account and applications stay protected.", icon: ShieldCheck },
    { title: "Verified Jobs", description: "Openings are reviewed before they go live.", icon: BadgeCheck },
    { title: "Here to help", description: "Get support whenever you need it.", icon: Building2 },
  ];
  return <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[.95fr_2.05fr] lg:items-center lg:gap-8 lg:px-11">
    <div className="max-w-sm">
      <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#167B55]"><span className="h-0.5 w-6 bg-[#3FA47B]" />Why choose JobZ</p>
      <h2 className="text-2xl font-semibold leading-tight tracking-[-.04em] text-[#111827]">Your dream job is just<br className="hidden lg:block" /> a few clicks away</h2>
      <p className="mt-2 max-w-xs text-xs leading-5 text-[#475569]">Find opportunities that fit your skills, goals, and the way you want to work.</p>
      <Link href="/register" className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-[#16895C] px-4 text-xs font-semibold text-white hover:bg-[#328A66]">Get Started Free <ArrowRight className="size-3.5" /></Link>
    </div>
    <div className="grid grid-cols-2 border-y border-[#E5E7EB] sm:grid-cols-4 sm:border-y-0">
      {benefits.map(({ title, description, icon: Icon }) => <div key={title} className="border-[#E5E7EB] px-3 py-4 sm:border-l sm:px-4 lg:px-5">
        <span className="grid size-10 place-items-center rounded-full bg-[#EAF5F0] text-[#167B55]"><Icon className="size-5" /></span>
        <h3 className="mt-2.5 text-xs font-semibold text-[#111827]">{title}</h3>
        <p className="mt-1 text-[10px] leading-4 text-[#475569]">{description}</p>
      </div>)}
    </div>
  </section>;
}

export function CTASection() {
  return <section className="mx-auto max-w-7xl px-5 pb-3 pt-5 sm:px-8 lg:px-11">
    <div className="relative flex min-h-[88px] items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#16895C] via-[#239966] to-[#4CB686] px-5 py-5 text-white sm:px-8">
      <div className="relative z-10 max-w-lg">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">Ready to take the next step in your career?</h2>
        <p className="mt-1 text-[11px] text-white/90 sm:text-xs">Find your next opportunity with JobZ.</p>
      </div>
      <Link href="/jobs" className="relative z-10 inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-[#111827] shadow-sm hover:bg-[#EAF5F0]">Browse Jobs <ArrowRight className="size-3.5" /></Link>
      <div aria-hidden="true" className="pointer-events-none absolute -right-2 bottom-0 hidden h-full w-[28%] items-end justify-center opacity-35 sm:flex">
        <div className="relative mb-4 flex items-end gap-3 text-[#0B6844]"><Monitor className="mb-0 size-14" /><Sprout className="size-12" /></div>
      </div>
      <div aria-hidden="true" className="absolute -right-12 -top-16 size-48 rounded-full border border-white/15" />
    </div>
  </section>;
}

function EmptyInline({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-[#D8E4DD] bg-white px-4 py-5 text-center text-xs text-[#64748B]">{message}</div>;
}

function JobCardSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />)}</div>;
}
