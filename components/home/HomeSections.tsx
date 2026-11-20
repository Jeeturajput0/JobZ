"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Database,
  Flame,
  HardHat,
  Laptop,
  MapPin,
  Megaphone,
  Monitor,
  PenTool,
  Rocket,
  Search,
  ShieldCheck,
  Sprout,
  TrendingUp,
  UserRoundPlus,
  Users,
} from "lucide-react";
import type { Job } from "@/data/jobs";
import { useJobZ } from "@/components/provider";
import { motion } from "framer-motion";

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
};
export type HomeCompany = {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
  companySize: string;
  description: string;
  jobCount: number;
};
export type HomeSkill = { name: string; jobs: number };

const categoryIcons = [
  Laptop,
  Megaphone,
  PenTool,
  TrendingUp,
  Database,
  Calculator,
  Users,
  HardHat,
];

function CompanyMark({
  company,
  compact = false,
}: {
  company: Pick<HomeCompany, "name" | "logo">;
  compact?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-[#167B55] ${compact ? "size-11" : "size-14"}`}
    >
      {company.logo ? (
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className="size-full object-contain p-1.5"
        />
      ) : (
        <span className="text-xl font-bold">
          {company.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function HomeHero({ skills }: { skills: HomeSkill[] }) {
  return (
    <section className="relative mx-auto grid min-h-[340px] max-w-7xl items-center overflow-hidden px-5 pb-7 pt-8 sm:px-8 lg:min-h-[344px] lg:grid-cols-[1.12fr_.88fr] lg:gap-4 lg:px-11 lg:py-0">
      <div className="relative z-20 max-w-[590px] py-3 lg:py-7">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EAF5F0] px-4 py-2 text-xs font-medium text-[#172B25] sm:text-sm">
          <span className="size-2 rounded-full bg-[#3FA47B]" />A better way to
          work
        </div>
        <h1 className="mt-4 max-w-[570px] text-[clamp(2.75rem,6.3vw,3.55rem)] font-semibold leading-[.99] tracking-[-.055em] text-[#111827]">
          Find work that
          <br className="hidden sm:block" /> works{" "}
          <span className="font-serif font-semibold italic tracking-[-.045em] text-[#218B5E]">
            for you.
          </span>
        </h1>
        <p className="mt-3 max-w-[475px] text-[15px] leading-6 text-[#475569] sm:text-base">
          JobZ connects your skills and ambitions with employers seeking people
          like you, so you can explore career opportunities that fit the way you
          want to work.
        </p>

        <form
          action="/jobs"
          method="get"
          className="mt-4 flex max-w-[555px] flex-wrap items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-[0_5px_18px_rgba(17,24,39,.07)] sm:flex-nowrap"
        >
          <label className="flex min-h-10 min-w-[190px] flex-1 items-center gap-2.5 px-2.5 text-[#111827]">
            <Search className="size-4 shrink-0" />
            <span className="sr-only">Search jobs</span>
            <input
              name="q"
              placeholder="Search jobs (e.g. React Developer)"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748B] sm:text-sm"
            />
          </label>
          <span className="hidden h-7 w-px bg-[#E5E7EB] sm:block" />
          <label className="flex min-h-10 min-w-[125px] flex-1 items-center gap-2.5 border-t border-[#F1F5F9] px-2.5 text-[#111827] sm:border-0">
            <MapPin className="size-4 shrink-0" />
            <span className="sr-only">Location</span>
            <input
              name="location"
              placeholder="Location"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748B] sm:text-sm"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#328A66] sm:w-auto"
          >
            Search Jobs <ArrowRight className="size-4" />
          </button>
        </form>

        <p className="mt-2 max-w-[555px] text-[13px] leading-5 text-[#64748B]">
          Search by job title or skill, then narrow your options by location,
          category, and experience level.
        </p>

        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#172B25]">
              <Flame className="size-3.5 fill-orange-500 text-orange-500" />{" "}
              Trending:
            </span>
            {skills.slice(0, 5).map((skill) => (
              <Link
                key={skill.name}
                href={`/jobs?q=${encodeURIComponent(skill.name)}`}
                className="font-medium text-[#176D4C] hover:text-[#328A66]"
              >
                {skill.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="relative hidden h-full min-h-[330px] lg:block">
        <div className="absolute bottom-0 left-[6%] h-[278px] w-[74%] rotate-[-7deg] rounded-[36px] bg-gradient-to-br from-[#DEF4E9] via-[#EAF5F0] to-[#F7FCF9]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 74 60"
          className="absolute left-[10%] top-[15%] h-14 w-16 text-[#16895C]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 6l8 14M5 25l15 4M21 40l-4 12" />
        </svg>
        <Image
          src="/images/jobz-hero-candidate.png"
          alt="Smiling professional holding a laptop"
          width={1080}
          height={1440}
          priority
          className="absolute bottom-0 left-[48%] z-10 h-[103%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
        />
        <div className="absolute right-[1%] top-[21%] z-20 rotate-[-5deg] font-serif text-[21px] italic leading-[1.12] text-[#111827]">
          Build your
          <br />
          career with
          <br />
          <span className="text-[#167B55]">JobZ</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 120 22"
            className="mt-1 h-5 w-28 text-[#167B55]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 12c18 14 16-14 27-9 9 4-1 16 12 14C64 15 75 3 118 2" />
          </svg>
        </div>
      </div>
      <div className="relative mx-auto mt-3 h-[285px] w-full max-w-[440px] lg:hidden">
        <div className="absolute bottom-0 left-[9%] h-[240px] w-[80%] rotate-[-6deg] rounded-[36px] bg-[#EAF5F0]" />
        <Image
          src="/images/jobz-hero-candidate.png"
          alt="Smiling professional holding a laptop"
          width={1080}
          height={1440}
          priority
          className="absolute bottom-0 left-1/2 z-10 h-full w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
        />
        <span className="absolute right-0 top-8 z-20 rotate-[-6deg] font-serif text-lg italic leading-tight text-[#167B55]">
          Build your
          <br />
          career with JobZ
        </span>
      </div>
    </section>
  );
}

export function TrustedCompanies({ companies }: { companies: HomeCompany[] }) {
  return (
    <section
      aria-label="Companies hiring on JobZ"
      className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-11"
    >
      <div className="mb-3">
        <h2 className="text-base text-2xl font-semibold tracking-tight text-[#111827]">
          Explore companies on JobZ
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-[#64748B]">
          Learn about employers in our directory and see their current openings
          when available.
        </p>
      </div>
     
<div className="grid min-h-[100px] grid-cols-2 items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(17,24,39,.05)] sm:grid-cols-3 lg:grid-cols-6">
  {companies.slice(0, 6).map((company) => (
    <div
      key={company.id}
      className="flex h-16 min-w-0 items-center justify-center px-3"
      title={company.name}
    >
      {company.logo ? (
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className="block max-h-14 max-w-full object-contain"
        />
      ) : (
        <span className="text-sm font-semibold text-[#475569]">
          {company.name}
        </span>
      )}
    </div>
  ))}

  {companies.length === 0 && (
    <p className="col-span-2 text-center text-[13px] text-[#64748B] sm:col-span-3 lg:col-span-6">
      Employer profiles will appear here as companies join JobZ.
    </p>
  )}
</div>

    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <div>
        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#167B55]">
          <span className="h-0.5 w-5 bg-[#3FA47B]" />
          {eyebrow}
        </p>
        <h2 className="text-xl font-semibold tracking-[-.035em] text-[#111827] sm:text-[22px]">
          {title}
        </h2>
        {description && (
          <p className=" max-w-2xl text-[13px] leading-4 text-[#64748B]">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-[#176D4C] hover:text-[#328A66]"
        >
          {linkText || "View all"}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}


export function HowJobZWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description:
        "Sign up on JobZ and build your professional profile. Add your skills, qualifications, experience, and career preferences to help employers discover you.",
      icon: UserRoundPlus,
      href: "/register",
      action: "Create free account",
    },
    {
      number: "02",
      title: "Discover the Right Jobs",
      description:
        "Explore thousands of opportunities and find roles that match your interests. Filter jobs by location, experience, salary, and job type.",
      icon: Search,
      href: "/jobs",
      action: "Explore opportunities",
    },
    {
      number: "03",
      title: "Apply & Move Forward",
      description:
        "Find a role that matches your goals, review the requirements, and submit your application. Take the next step towards your dream career.",
      icon: BriefcaseBusiness,
      href: "/jobs",
      action: "Find your next job",
    },
  ];

  return (
    <section
      aria-labelledby="how-jobz-works-title"
      className="bg-[#F7FAF8] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-11">

        {/* Section Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D6EDE1] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[.12em] text-[#238D62]">
            <span className="size-1.5 rounded-full bg-[#238D62]" />
            How JobZ Works
          </p>

          <h2
            id="how-jobz-works-title"
            className="text-2xl font-bold leading-tight tracking-[-.04em] text-[#172B25] sm:text-3xl lg:text-[36px]"
          >
            Your next career move starts here
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#64748B] sm:text-base">
            Finding the right job doesn't have to be complicated.
            Follow three simple steps to discover opportunities and
            connect with employers on JobZ.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12 lg:gap-6">
          {steps.map(({ number, title, description, icon: Icon, href, action }) => (
            <Link
              key={number}
              href={href}
              className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-[#E5ECE8] bg-white p-6 shadow-[0_4px_20px_rgba(23,43,37,.035)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#B7DCCA] hover:shadow-[0_14px_32px_rgba(23,107,76,.09)] sm:p-7 lg:min-h-[300px] lg:p-8"
            >
              {/* Step Number */}
              <span className="absolute right-6 top-5 text-[42px] font-bold tracking-[-.06em] text-[#EFF5F1] transition-colors duration-300 group-hover:text-[#DCEFE4]">
                {number}
              </span>

              {/* Icon */}
              <div className="relative z-10 grid size-[62px] place-items-center rounded-2xl bg-[#EAF5F0] text-[#238D62] transition-all duration-300 group-hover:bg-[#16895C] group-hover:text-white">
                <Icon className="size-7" strokeWidth={2} />
              </div>

              {/* Content */}
              <div className="mt-7">
                <h3 className="text-lg font-bold tracking-[-.025em] text-[#172B25] sm:text-xl">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#64748B]">
                  {description}
                </p>
              </div>

              {/* Action */}
              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-[#238D62]">
                {action}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="mt-9 text-center">
          <p className="text-sm text-[#64748B]">
            Ready to take the next step?
            <Link
              href="/register"
              className="ml-1 font-semibold text-[#16895C] transition-colors hover:text-[#116B47]"
            >
              Get started with JobZ today.
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function CategoriesSection({
  categories,
}: {
  categories: HomeCategory[];
}) {
  const firstSlider = categories.slice(0, 5);
  const secondSlider = categories.slice(5, 10);

  const renderSlider = (items: HomeCategory[], direction: "left" | "right") => {
    if (!items.length) return null;

    const duplicatedItems = [...items, ...items];

    return (
      <div className="overflow-hidden">
        <motion.div
          className="flex w-max gap-3"
          animate={{
            x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          }}
          whileHover={{ animationPlayState: "paused" }}
        >
          {duplicatedItems.map((category, index) => {
            const CategoryIcon =
              categoryIcons[
                categories.findIndex((item) => item.id === category.id) %
                  categoryIcons.length
              ];

            return (
              <Link
                key={`${category.id}-${index}`}
                href={`/jobs?category=${encodeURIComponent(category.name)}`}
                className="group flex min-h-[76px] w-[220px] shrink-0 items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(17,24,39,.035)] transition-all hover:-translate-y-1 hover:border-[#B7DCCA] hover:shadow-md sm:w-[245px]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#EAF5F0] text-[#167B55]">
                  <CategoryIcon className="size-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#111827]">
                    {category.name}
                  </span>

                  <span className="mt-1 block text-xs text-[#64748B]">
                    {category.count.toLocaleString()}{" "}
                    {category.count === 1 ? "job" : "jobs"}
                  </span>
                </span>

                <ArrowRight className="size-4 shrink-0 text-[#111827] transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </motion.div>
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-5 py-7 sm:px-8 lg:px-11">
      <SectionHeading
        eyebrow="Popular categories"
        title="Explore top job categories"
        description="Browse opportunities across technology, business, creative work, and other professional fields to find roles that match your interests."
        href="/jobs"
        linkText="View all categories"
      />

      {categories.length === 0 ? (
        <EmptyInline message="Job categories will appear here when they have been added." />
      ) : (
        <>
          {/* Slider 1: Right to Left */}
          {renderSlider(firstSlider, "left")}

          {/* Slider 2: Left to Right */}
          {secondSlider.length > 0 && renderSlider(secondSlider, "right")}
        </>
      )}
    </section>
  );
}

export function FeaturedJobCard({ job }: { job: Job }) {
  const { saved, toggleSave, apply } = useJobZ();
  const brand = { name: job.company, logo: job.logoUrl || "" };
  return (
    <article className="flex min-h-[180px] flex-col rounded-xl border border-[#E5E7EB] bg-white p-3.5 shadow-[0_3px_11px_rgba(17,24,39,.06)] transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <CompanyMark company={brand} compact />
        <button
          type="button"
          aria-label={saved.includes(job.id) ? "Remove saved job" : "Save job"}
          aria-pressed={saved.includes(job.id)}
          onClick={() => toggleSave(job.id)}
          className="rounded-md p-1.5 text-[#111827] hover:bg-[#EAF5F0] hover:text-[#167B55]"
        >
          <Bookmark
            className="size-5"
            fill={saved.includes(job.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <Link
        href={`/jobs/${job.id}`}
        className="mt-2 text-[15px] font-semibold leading-5 tracking-[-.02em] text-[#111827] hover:text-[#167B55]"
      >
        {job.title}
      </Link>
      <p className="text-[13px] text-[#475569]">{job.company}</p>
      <p className="line-clamp-2 text-[13px] leading-5 text-black">
        {job.shortDescription || job.description}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#334155] sm:text-xs">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <BriefcaseBusiness className="size-3" />
          {job.type}
        </span>
        <span>{job.mode}</span>
        <span className="inline-flex items-center gap-1">◷ {job.salary}</span>
      </div>
      <div className="mt-2 flex min-h-5 flex-wrap gap-1.5">
        {(job.skills || []).slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] font-medium text-[#334155]"
          >
            {skill}
          </span>
        ))}
        {!(job.skills || []).length && (
          <>
            <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] text-[#334155]">
              {job.mode}
            </span>
            <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[10px] text-[#334155]">
              {job.category}
            </span>
          </>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#F1F5F9] pt-2.5">
        <span className="text-[11px] text-[#475569]">
          Posted {job.posted.toLowerCase()}
        </span>
        <button
          type="button"
          onClick={() => apply(job)}
          className="inline-flex min-h-8 items-center rounded-lg bg-[#16895C] px-3 text-xs font-semibold text-white hover:bg-[#328A66]"
        >
          Apply Now
        </button>
      </div>
    </article>
  );
}

export function FeaturedJobs({
  jobs,
  loading,
  error,
}: {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-11">
      <SectionHeading
        eyebrow="Featured jobs"
        title="Handpicked opportunities for you"
        description="Explore current openings with role details, skills, work arrangements, and compensation information to help you compare your options."
        href="/jobs"
        linkText="View all jobs"
      />
      {loading ? (
        <JobCardSkeleton />
      ) : error ? (
        <EmptyInline message="Job listings are temporarily unavailable." />
      ) : jobs.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 3).map((job) => (
            <FeaturedJobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyInline message="New job openings will appear here as employers publish them." />
      )}
    </section>
  );
}



export function TopCompanies({
  companies,
  loading,
  error,
}: {
  companies: HomeCompany[];
  loading: boolean;
  error: boolean;
}) {
  const visibleCompanies = companies.slice(0, 6);

  const CompanyCards = ({
    duplicate = false,
  }: {
    duplicate?: boolean;
  }) => (
    <div
      className="flex shrink-0 items-center gap-3 pr-3 sm:gap-4 sm:pr-4"
      aria-hidden={duplicate || undefined}
    >
      {visibleCompanies.map((company) => (
        <Link
          key={`${duplicate ? "duplicate-" : ""}${company.id}`}
          href={`/companies/${company.id}`}
          tabIndex={duplicate ? -1 : undefined}
          className="group flex h-[86px] w-[155px] shrink-0 items-center gap-3 rounded-xl border border-[#E5ECE8] bg-white px-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B7DCCA] hover:shadow-[0_6px_18px_rgba(23,107,76,.08)] sm:h-[90px] sm:w-[175px] sm:px-4"
        >
          {/* Company Logo */}
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F4F8F6]">
            {company.logo ? (
              <img
                src={company.logo}
                alt=""
                loading="lazy"
                className="max-h-9 max-w-9 object-contain transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <span className="text-xl font-bold text-[#238D62]">
                {company.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Company Details */}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-left text-[13px] font-semibold leading-5 text-[#172B25] transition-colors group-hover:text-[#16895C]">
              {company.name}
            </p>

            <p className="mt-0.5 text-left text-[11px] text-[#71817A]">
              {company.jobCount.toLocaleString()}{" "}
              {company.jobCount === 1 ? "opening" : "openings"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl overflow-hidden px-5 py-3 sm:px-8 lg:px-11">
      <SectionHeading
        eyebrow="Top companies"
        title="Explore companies hiring on JobZ"
        description="Discover leading employers, explore their profiles, and find opportunities that match your career goals."
        href="/companies"
        linkText="View all companies"
      />

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[86px] w-[155px] shrink-0 animate-pulse rounded-xl border border-[#E5ECE8] bg-white sm:w-[175px]"
            />
          ))}
        </div>
      ) : error ? (
        <EmptyInline message="Company profiles are temporarily unavailable." />
      ) : visibleCompanies.length ? (
        <div className="group/marquee relative overflow-hidden">
          <div
            className={`flex w-max ${
              visibleCompanies.length > 1
                ? "animate-companies-marquee group-hover/marquee:[animation-play-state:paused]"
                : ""
            }`}
          >
            <CompanyCards />
            {visibleCompanies.length > 1 && (
              <CompanyCards duplicate />
            )}
          </div>
        </div>
      ) : (
        <EmptyInline message="Company profiles will appear here as employers join JobZ." />
      )}

      <style jsx>{`
        .animate-companies-marquee {
          animation: companies-marquee 32s linear infinite;
          will-change: transform;
        }

        @keyframes companies-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-companies-marquee {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}


export function WhyChooseJobZ() {
  const benefits = [
    {
      title: "Simple Job Search",
      description:
        "Discover relevant opportunities with smart search and easy filters for job roles, skills, and locations.",
      icon: Rocket,
    },
    {
      title: "Your Career Profile",
      description:
        "Build your professional profile, save interesting opportunities, and keep track of your applications.",
      icon: ShieldCheck,
    },
    {
      title: "Transparent Job Details",
      description:
        "Understand job responsibilities, required skills, salary information, and work arrangements before applying.",
      icon: BadgeCheck,
    },
    {
      title: "Support That Matters",
      description:
        "Need help with your job search or account? The JobZ team is here to help you find the right direction.",
      icon: Building2,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5  sm:px-8 lg:px-11 lg:py-10">
      <div className="grid gap-10 lg:grid-cols-[.85fr_1.65fr] lg:items-center lg:gap-14">
        {/* Left Content */}
        <div className="max-w-lg">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#167B55]">
            <span className="h-0.5 w-7 bg-[#3FA47B]" />
            Why choose JobZ
          </p>

          <h2 className="text-3xl font-semibold leading-[1.12] tracking-[-.045em] text-[#172B25] sm:text-4xl lg:text-[42px]">
            Your next career opportunity starts here.
          </h2>

          <p className="mt-5 max-w-md text-[15px] leading-7 text-[#71817A]">
            Job searching should feel simple, not stressful. JobZ brings
            opportunities, employers, and your career journey together in one
            convenient place.
          </p>

          <Link
            href="/register"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#3FA47B] px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#328A66] hover:shadow-md"
          >
            Start Your Journey
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Benefit Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {benefits.map(({ title, description, icon: Icon }, index) => (
            <div
              key={title}
              className="group flex min-h-[100px] flex-col rounded-2xl border border-[#E5ECE8] bg-white p-3 shadow-[0_3px_14px_rgba(23,43,37,.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B7DCCA] hover:shadow-[0_12px_30px_rgba(23,107,76,.08)] sm:min-h-[200px] sm:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-[#EAF5F0] text-[#238D62] transition-colors group-hover:bg-[#DDF1E7]">
                  <Icon className="size-7" />
                </span>

                <span className="text-sm font-semibold tracking-wide text-[#B2C0B8]">
                  0{index + 1}
                </span>
              </div>

              <h3 className="mt-3 text-base font-semibold tracking-tight text-[#172B25] sm:text-lg">
                {title}
              </h3>

              <p className="mt-2 text-sm leading-5 text-[#71817A]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-3 lg:px-11">
      <div className="relative flex min-h-[120px] items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#16895C] via-[#239966] to-[#4CB686] px-5 py-5 text-white sm:px-8">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            Create your profile and explore what’s next
          </h2>
          <p className="mt-1 text-xs text-white/90 sm:text-[13px]">
            Share your experience, discover relevant openings, and apply when a
            role feels right.
          </p>
        </div>
        <Link
          href="/jobs"
          className="relative z-10 inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-[#111827] shadow-sm hover:bg-[#EAF5F0]"
        >
          Browse Jobs <ArrowRight className="size-3.5" />
        </Link>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 bottom-0 hidden h-full w-[28%] items-end justify-center opacity-35 sm:flex"
        >
          <div className="relative mb-4 flex items-end gap-3 text-[#0B6844]">
            <Monitor className="mb-0 size-14" />
            <Sprout className="size-12" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-16 size-48 rounded-full border border-white/15"
        />
      </div>
    </section>
  );
}

function EmptyInline({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#D8E4DD] bg-white px-4 py-5 text-center text-xs text-black/70 sm:text-sm">
      {message}
    </div>
  );
}

function JobCardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-xl border border-[#E5E7EB] bg-white"
        />
      ))}
    </div>
  );
}
