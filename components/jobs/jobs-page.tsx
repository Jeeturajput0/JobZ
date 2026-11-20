"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BriefcaseBusiness, ChevronDown, Clock3, Filter, MapPin, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { toJob, type ApiJob, type Job } from "@/data/jobs";
import { useJobZ } from "@/components/provider";

type FilterState = {
  category: string;
  jobType: string;
  workMode: string;
  experience: string;
  location: string;
  skill: string;
  salaryMin: string;
  salaryMax: string;
  verifiedCompany: boolean;
  postedWithin: string;
};

const initialFilters: FilterState = {
  category: "",
  jobType: "",
  workMode: "",
  experience: "",
  location: "",
  skill: "",
  salaryMin: "",
  salaryMax: "",
  verifiedCompany: false,
  postedWithin: "",
};

const fieldClass = "mt-2 min-h-10 w-full rounded-lg border border-[#E5ECE8] bg-white px-3 text-sm text-[#172B25] outline-none transition focus:border-[#3FA47B] focus:ring-2 focus:ring-[#3FA47B]/20";
const checkClass = "size-4 rounded border-[#CBD8D0] accent-[#3FA47B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B]";

function FilterControls({
  filters, setFilter, categories, onClear,
}: {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  categories: { name: string; count: number }[];
  onClear: () => void;
}) {
  const fieldId = useId();
  return <div className="space-y-5">
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-semibold text-[#172B25]"><SlidersHorizontal className="size-4 text-[#3FA47B]" />Filters</h2>
      <button type="button" onClick={onClear} className="text-sm font-semibold text-[#267653] hover:underline">Clear all</button>
    </div>

    <label className="block text-sm font-medium text-[#52635B]">Category
      <select value={filters.category} onChange={(event) => setFilter("category", event.target.value)} className={fieldClass}>
        <option value="">All categories</option>
        {categories.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}
      </select>
    </label>
    <label className="block text-sm font-medium text-[#52635B]">Job type
      <select value={filters.jobType} onChange={(event) => setFilter("jobType", event.target.value)} className={fieldClass}>
        <option value="">Any type</option><option value="full-time">Full time</option><option value="part-time">Part time</option><option value="internship">Internship</option><option value="contract">Contract</option>
      </select>
    </label>
    <label className="block text-sm font-medium text-[#52635B]">Work mode
      <select value={filters.workMode} onChange={(event) => setFilter("workMode", event.target.value)} className={fieldClass}>
        <option value="">Any work mode</option><option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option>
      </select>
    </label>
    <label className="block text-sm font-medium text-[#52635B]">Experience level
      <select value={filters.experience} onChange={(event) => setFilter("experience", event.target.value)} className={fieldClass}>
        <option value="">Any experience</option><option value="Fresher">Fresher</option><option value="Entry">Entry level</option><option value="Junior">Junior</option><option value="Mid">Mid level</option><option value="Senior">Senior</option>
      </select>
    </label>
    <label className="block text-sm font-medium text-[#52635B]">Location
      <span className="relative block"><MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#849189]" /><input value={filters.location} onChange={(event) => setFilter("location", event.target.value)} placeholder="City or region" className={`${fieldClass} pl-9`} /></span>
    </label>
    <label className="block text-sm font-medium text-[#52635B]">Skill
      <span className="relative block"><BriefcaseBusiness className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#849189]" /><input value={filters.skill} onChange={(event) => setFilter("skill", event.target.value)} placeholder="e.g. React" className={`${fieldClass} pl-9`} /></span>
    </label>
    <fieldset>
      <legend className="text-sm font-medium text-[#52635B]">Salary range (USD)</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="sr-only" htmlFor={`${fieldId}-salary-min`}>Minimum salary</label><input id={`${fieldId}-salary-min`} type="number" min="0" value={filters.salaryMin} onChange={(event) => setFilter("salaryMin", event.target.value)} placeholder="Min" className="min-h-10 min-w-0 rounded-lg border border-[#E5ECE8] bg-white px-3 text-sm outline-none focus:border-[#3FA47B] focus:ring-2 focus:ring-[#3FA47B]/20" />
        <label className="sr-only" htmlFor={`${fieldId}-salary-max`}>Maximum salary</label><input id={`${fieldId}-salary-max`} type="number" min="0" value={filters.salaryMax} onChange={(event) => setFilter("salaryMax", event.target.value)} placeholder="Max" className="min-h-10 min-w-0 rounded-lg border border-[#E5ECE8] bg-white px-3 text-sm outline-none focus:border-[#3FA47B] focus:ring-2 focus:ring-[#3FA47B]/20" />
      </div>
    </fieldset>
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[#52635B]"><input type="checkbox" checked={filters.verifiedCompany} onChange={(event) => setFilter("verifiedCompany", event.target.checked)} className={`${checkClass} mt-0.5`} /><span className="inline-flex items-center gap-1.5">Verified companies <ShieldCheck className="size-4 text-[#3FA47B]" /></span></label>
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[#52635B]"><input type="checkbox" checked={filters.postedWithin === "7"} onChange={(event) => setFilter("postedWithin", event.target.checked ? "7" : "")} className={`${checkClass} mt-0.5`} /><span className="inline-flex items-center gap-1.5">Posted in the last 7 days <Clock3 className="size-4 text-[#3FA47B]" /></span></label>
  </div>;
}

function LoadingCards() {
  return <div aria-label="Loading job results" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse rounded-2xl border border-[#E5ECE8] bg-white p-5"><div className="flex gap-3"><div className="size-12 rounded-xl bg-[#EAF5F0]" /><div className="flex-1 space-y-2"><div className="h-4 w-3/4 rounded bg-[#E8EEEA]" /><div className="h-3 w-1/2 rounded bg-[#F0F3F1]" /></div></div><div className="mt-6 h-3 rounded bg-[#F0F3F1]" /><div className="mt-2 h-3 w-4/5 rounded bg-[#F0F3F1]" /><div className="mt-5 flex gap-2"><div className="h-7 w-20 rounded-full bg-[#EAF5F0]" /><div className="h-7 w-16 rounded-full bg-[#F0F3F1]" /></div><div className="mt-6 h-9 rounded bg-[#F0F3F1]" /></div>)}</div>;
}

function JobResultCard({ job, saved, onSave, index }: { job: Job; saved: boolean; onSave: () => void; index: number }) {
  return <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.12) }} whileHover={{ y: -2 }} className="flex min-h-[270px] flex-col rounded-2xl border border-[#E5ECE8] bg-white p-5 shadow-[0_2px_8px_rgba(23,43,37,.025)] transition-shadow hover:border-[#C7E1D3] hover:shadow-[0_12px_28px_rgba(23,43,37,.07)] sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#E5ECE8] bg-[#F4F8F5] text-base font-bold text-[#267653]"><span>{job.logo}</span>{job.logoUrl && <img src={job.logoUrl} alt={`${job.company} logo`} onError={(event) => { event.currentTarget.style.display = "none"; }} className="absolute inset-0 size-full bg-white object-contain p-1" />}</span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#172B25]">{job.company}</p><p className="mt-0.5 truncate text-xs text-[#71817A]">{job.location}</p></div>
      </div>
      <button type="button" onClick={onSave} aria-label={saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`} aria-pressed={saved} className={`grid size-10 shrink-0 place-items-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B] ${saved ? "border-[#C6E4D4] bg-[#EAF5F0] text-[#267653]" : "border-[#E5ECE8] bg-white text-[#71817A] hover:bg-[#F4F8F5] hover:text-[#267653]"}`}>
        <Bookmark className="size-[18px]" fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {job.featured && <span className="rounded-full bg-[#F0F7F2] px-2.5 py-1 text-[11px] font-semibold text-[#267653]">Featured</span>}
      {job.verifiedCompany && <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F7F2] px-2.5 py-1 text-[11px] font-semibold text-[#267653]"><ShieldCheck className="size-3.5" />Verified company</span>}
      {job.posted && <span className="text-xs text-[#849189]">{job.posted}</span>}
    </div>
    <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-snug tracking-[-.02em] text-[#172B25]"><Link href={`/jobs/${job.id}`} className="rounded-sm outline-none hover:text-[#267653] focus-visible:ring-2 focus-visible:ring-[#3FA47B]">{job.title}</Link></h2>
    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#71817A]">{job.shortDescription || job.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {job.type && <span className="rounded-full border border-[#E5ECE8] bg-[#F8FAF9] px-2.5 py-1 text-xs text-[#52635B]">{job.type}</span>}
      {job.mode && <span className="rounded-full border border-[#E5ECE8] bg-[#F8FAF9] px-2.5 py-1 text-xs text-[#52635B]">{job.mode}</span>}
      {job.experienceLevel && <span className="rounded-full border border-[#E5ECE8] bg-[#F8FAF9] px-2.5 py-1 text-xs text-[#52635B]">{job.experienceLevel}</span>}
      {job.category && <span className="rounded-full border border-[#E5ECE8] bg-[#F8FAF9] px-2.5 py-1 text-xs text-[#52635B]">{job.category}</span>}
    </div>
    {job.skills?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{job.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-md bg-[#EAF5F0] px-2 py-1 text-[11px] font-medium text-[#315B45]">{skill}</span>)}{job.skills.length > 3 && <span className="px-1 py-1 text-[11px] text-[#71817A]">+{job.skills.length - 3}</span>}</div> : null}
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#EEF2EF] pt-4 mt-5">
      {(job.minSalary !== undefined || job.maxSalary !== undefined) ? <span className="min-w-0 truncate text-sm font-bold text-[#267653]">{job.salary}</span> : <span />}
      <Link href={`/jobs/${job.id}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#3FA47B] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#267653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B]">View job & apply</Link>
    </div>
  </motion.article>;
}

function activeFilterLabels(filters: FilterState, setFilter: FilterControlsProps["setFilter"]) {
  const chips: { key: string; label: string; remove: () => void }[] = [];
  const add = (key: keyof FilterState, label: string, value: string | boolean) => chips.push({ key, label, remove: () => setFilter(key, (typeof value === "boolean" ? false : "") as never) });
  if (filters.category) add("category", filters.category, filters.category);
  if (filters.jobType) add("jobType", filters.jobType.replaceAll("-", " "), filters.jobType);
  if (filters.workMode) add("workMode", filters.workMode === "onsite" ? "On-site" : filters.workMode, filters.workMode);
  if (filters.experience) add("experience", filters.experience, filters.experience);
  if (filters.location) add("location", filters.location, filters.location);
  if (filters.skill) add("skill", `Skill: ${filters.skill}`, filters.skill);
  if (filters.salaryMin) add("salaryMin", `Min $${filters.salaryMin}`, filters.salaryMin);
  if (filters.salaryMax) add("salaryMax", `Max $${filters.salaryMax}`, filters.salaryMax);
  if (filters.verifiedCompany) add("verifiedCompany", "Verified", true);
  if (filters.postedWithin) add("postedWithin", "Last 7 days", filters.postedWithin);
  return chips;
}

type FilterControlsProps = Parameters<typeof FilterControls>[0];

export function JobsSearchPage() {
  const searchParams = useSearchParams();
  const { saved, toggleSave } = useJobZ();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<FilterState>({ ...initialFilters, location: searchParams.get("location") || "", category: searchParams.get("category") || "" });
  const [sort, setSort] = useState("recommended");
  const [results, setResults] = useState<Job[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setFilters((current) => ({ ...current, location: searchParams.get("location") || "", category: searchParams.get("category") || "" }));
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    fetch("/api/categories", { cache: "no-store" }).then((response) => response.json()).then((data) => { if (active) setCategories(data.categories || []); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({ page: String(page), limit: "12", sort });
      const add = (key: string, value: string) => { if (value.trim()) params.set(key, value.trim()); };
      add("search", query);
      add("location", filters.location);
      add("category", filters.category);
      add("jobType", filters.jobType);
      add("workMode", filters.workMode);
      add("experience", filters.experience);
      add("skills", filters.skill);
      add("salaryMin", filters.salaryMin);
      add("salaryMax", filters.salaryMax);
      if (filters.verifiedCompany) params.set("verifiedCompany", "true");
      if (filters.postedWithin) params.set("postedWithin", filters.postedWithin);
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/jobs?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error("We couldn’t load job listings. Please try again.");
        if (!active) return;
        setResults((data.jobs as ApiJob[]).map(toJob));
        setTotal(Number(data.pagination?.total) || 0);
        setTotalPages(Math.max(1, Number(data.pagination?.totalPages) || 1));
      } catch (fetchError) {
        if (!active || (fetchError instanceof Error && fetchError.name === "AbortError")) return;
        setError("Please check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }, 200);
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [query, filters, sort, page, retry]);

  useEffect(() => {
    if (!filtersOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFiltersOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [filtersOpen]);

  const setFilter: FilterControlsProps["setFilter"] = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const clearAll = () => {
    setQuery("");
    setFilters(initialFilters);
    setSort("recommended");
    setPage(1);
  };
  const chips = useMemo(() => {
    const items = activeFilterLabels(filters, setFilter);
    if (query.trim()) items.unshift({ key: "query", label: `Search: ${query.trim()}`, remove: () => { setQuery(""); setPage(1); } });
    return items;
  }, [filters, query]);
  const onSearch = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setPage(1); };

  const filterPanel = <FilterControls filters={filters} setFilter={setFilter} categories={categories} onClear={clearAll} />;
  return <main className="min-h-screen bg-[#F7F9F8] pb-16">
    <div className="mx-auto max-w-[1360px] px-4 pt-8 sm:px-7 sm:pt-10 lg:px-9">
      <section className="rounded-2xl border border-[#E0ECE5] bg-[linear-gradient(110deg,#EFF7F2,#F9FBF9)] px-5 py-7 sm:px-8 sm:py-8">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#3FA47B]">A better fit starts here</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><h1 className="text-3xl font-bold tracking-tight text-[#172B25] sm:text-4xl">Find Your Next Opportunity</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#71817A]">Discover jobs that match your skills, experience and career goals.</p></div>
          <p className="shrink-0 text-sm font-medium text-[#52635B]"><span className="text-lg font-bold text-[#267653]">{total.toLocaleString()}</span> open {total === 1 ? "role" : "roles"}</p>
        </div>
        <form onSubmit={onSearch} className="mt-6 grid gap-2 rounded-xl border border-[#E5ECE8] bg-white p-2 shadow-[0_6px_18px_rgba(23,43,37,.05)] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(170px,.75fr)_auto] md:items-center md:gap-0">
          <label className="flex min-w-0 items-center gap-3 px-3 md:border-r md:border-[#EEF2EF]"><Search className="size-[18px] shrink-0 text-[#3FA47B]" /><span className="sr-only">Search jobs by title, company, or keyword</span><input value={query} onChange={onQueryChange} placeholder="Job title, skill, or keyword" className="min-h-11 w-full min-w-0 border-0 bg-transparent text-sm text-[#172B25] outline-none placeholder:text-[#849189]" /></label>
          <label className="flex min-w-0 items-center gap-3 border-t border-[#EEF2EF] px-3 md:border-t-0 md:border-r"><MapPin className="size-[18px] shrink-0 text-[#3FA47B]" /><span className="sr-only">Location</span><input value={filters.location} onChange={(event) => setFilter("location", event.target.value)} placeholder="City or remote" className="min-h-11 w-full min-w-0 border-0 bg-transparent text-sm text-[#172B25] outline-none placeholder:text-[#849189]" /></label>
          <label className="flex min-w-0 items-center gap-3 border-t border-[#EEF2EF] px-3 md:border-t-0"><BriefcaseBusiness className="size-[18px] shrink-0 text-[#3FA47B]" /><span className="sr-only">Experience level</span><select value={filters.experience} onChange={(event) => setFilter("experience", event.target.value)} className="min-h-11 w-full min-w-0 appearance-none border-0 bg-transparent text-sm text-[#52635B] outline-none"><option value="">Any experience</option><option value="Fresher">Fresher</option><option value="Entry">Entry level</option><option value="Junior">Junior</option><option value="Mid">Mid level</option><option value="Senior">Senior</option></select><ChevronDown className="size-4 shrink-0 text-[#849189]" /></label>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#3FA47B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#267653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#267653]"><Search className="size-4" />Search jobs</button>
        </form>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-2xl border border-[#E5ECE8] bg-white p-5 lg:sticky lg:top-[80px] lg:block">{filterPanel}</aside>
        <section aria-label="Job search results" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-xl font-bold text-[#172B25]">Find Jobs</h2><p className="mt-1 text-sm text-[#71817A]">{loading ? "Updating results…" : `${total.toLocaleString()} opportunities`}</p></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE8E1] bg-white px-3.5 text-sm font-semibold text-[#267653] lg:hidden"><Filter className="size-4" />Filters{chips.length > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#EAF5F0] text-xs">{chips.length}</span>}</button>
              <label className="flex items-center gap-2 text-sm text-[#71817A]">Sort by
                <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="min-h-10 rounded-lg border border-[#E5ECE8] bg-white px-3 text-sm font-medium text-[#172B25] outline-none focus:border-[#3FA47B] focus:ring-2 focus:ring-[#3FA47B]/20"><option value="recommended">Most relevant</option><option value="latest">Recently posted</option><option value="salaryHigh">Salary: high to low</option><option value="salaryLow">Salary: low to high</option></select>
              </label>
            </div>
          </div>

          {chips.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">{chips.map((chip) => <span key={chip.key} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#DDEBE3] bg-[#EFF7F2] px-3 text-xs font-medium text-[#315B45]">{chip.label}<button type="button" onClick={chip.remove} aria-label={`Remove ${chip.label} filter`} className="grid size-5 place-items-center rounded-full hover:bg-white"><X className="size-3.5" /></button></span>)}<button type="button" onClick={clearAll} className="min-h-8 px-2 text-xs font-semibold text-[#267653] hover:underline">Clear all</button></div>}

          <div className="mt-4">
            {loading ? <LoadingCards /> : error ? <div role="alert" className="rounded-2xl border border-[#E5ECE8] bg-white px-6 py-12 text-center"><p className="font-semibold text-[#172B25]">We couldn’t load jobs</p><p className="mt-2 text-sm text-[#71817A]">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-5 min-h-10 rounded-lg bg-[#3FA47B] px-4 text-sm font-semibold text-white hover:bg-[#267653]">Try again</button></div> : results.length ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{results.map((job, index) => <JobResultCard key={job.id} job={job} saved={saved.includes(job.id)} onSave={() => void toggleSave(job.id)} index={index} />)}</div> : <div className="rounded-2xl border border-dashed border-[#D7E4DC] bg-white px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#EAF5F0] text-[#3FA47B]"><Search className="size-5" /></span><h3 className="mt-4 text-lg font-bold text-[#172B25]">No jobs found</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71817A]">Try adjusting your search or filters to discover more opportunities.</p><button type="button" onClick={clearAll} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE8E1] px-4 text-sm font-semibold text-[#267653] hover:bg-[#F5FAF7]"><X className="size-4" />Clear filters</button></div>}
          </div>
          {!loading && !error && totalPages > 1 && <nav aria-label="Job result pages" className="mt-7 flex items-center justify-between gap-4 rounded-xl border border-[#E5ECE8] bg-white p-3"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 rounded-lg border border-[#E5ECE8] px-4 text-sm font-semibold text-[#267653] disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-sm text-[#71817A]">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-lg border border-[#E5ECE8] px-4 text-sm font-semibold text-[#267653] disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>}
        </section>
      </div>
    </div>

    <AnimatePresence>
      {filtersOpen && <motion.div className="fixed inset-0 z-50 flex justify-end lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-[#172B25]/35" />
        <motion.aside role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" className="relative z-10 h-full w-full max-w-sm overflow-y-auto bg-[#F7F9F8] p-5 shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}>
          <div className="mb-5 flex items-center justify-between"><h2 id="mobile-filter-title" className="text-lg font-bold text-[#172B25]">Filter jobs</h2><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid size-10 place-items-center rounded-lg border border-[#E5ECE8] bg-white text-[#52635B]"><X className="size-5" /></button></div>
          <div className="rounded-2xl border border-[#E5ECE8] bg-white p-5">{filterPanel}</div>
          <button type="button" onClick={() => setFiltersOpen(false)} className="mt-4 min-h-11 w-full rounded-lg bg-[#3FA47B] text-sm font-semibold text-white hover:bg-[#267653]">Show {total} jobs</button>
        </motion.aside>
      </motion.div>}
    </AnimatePresence>
  </main>;
}
