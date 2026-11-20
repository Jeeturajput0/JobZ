"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Filter,
  Heart,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useJobZ } from "./provider";
import { toJob, type ApiJob, type Job } from "@/data/jobs";
import { AnimatedHeading } from "./animations/AnimatedHeading";
import { quickSpring, reveal, stagger, subtleReveal } from "@/lib/motion";

const MotionLink = motion.create(Link);

export { HomePage } from "./home/HomePage";

export function JobCard({ id, job: custom, staggered = false, homeCard = false }: { id?: string; job?: Job; staggered?: boolean; homeCard?: boolean }) {
  const { jobs, saved, toggleSave } = useJobZ();
  const j = custom || jobs.find((x) => x.id === id);
  if (!j) return null;
  return (
    <motion.article className={`job-card [&_:hover]:[transform:translateY(-3px)] [&_:hover]:[box-shadow:0_14px_35px_#172d4c0d] [&_:hover]:[border-color:#c9e3d7] [border:1px_solid_#ebeff3] [border-radius:.75rem] [padding:20px] [transition:all_.2s] [position:relative] [background:white] [&_h3]:[font-size:18px] [&_h3]:[letter-spacing:-.025em] [&_h3]:[color:#233b5d] [&_h3]:[margin:0_0_8px] [&_h3]:[line-height:1.4] [border-color:#E5ECE8] [&_h3]:[display:-webkit-box] [&_h3]:[overflow:hidden] [&_h3]:[min-height:50px] [&_h3]:[-webkit-box-orient:vertical] [&_h3]:[-webkit-line-clamp:2] flex flex-col [.job-card_&]:[display:flex] [.job-card_&]:[flex-direction:column] [.job-card_&]:[height:100%] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]${homeCard ? " home-job-card [.home-featured_&]:[min-height:380px] [.home-featured_&]:[padding:23px] [.home-featured_&]:[border-color:#E5ECE8] [.home-featured_&]:[border-radius:16px] [.home-featured_&]:[box-shadow:0_5px_20px_rgb(24_45_77_/_4%)] [&_:hover]:[border-color:#c9e3d7] [&_:hover]:[box-shadow:0_18px_40px_rgb(24_45_77_/_9%)] max-[600px]:[.home-featured_&]:[min-height:360px] max-[600px]:[.home-featured_&]:[padding:20px]" : ""}`} variants={subtleReveal} {...(!staggered && { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.18 } })} whileHover={{ y: -3 }}>
      <div className="job-card-top [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:15px] [.home-featured_&]:[margin-bottom:17px]">
        <span className="company-logo [display:grid] [place-items:center] [width:42px] [height:42px] [border-radius:11px] [color:#fff] [font-weight:700] [font-size:17px] max-[700px]:[.result-card>_&]:[width:36px] max-[700px]:[.result-card>_&]:[height:36px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[width:52px] [.home-featured_&]:[height:52px] [.home-featured_&]:[border:1px_solid_#edf0f5] [.home-featured_&]:[border-radius:14px] [.home-featured_&]:[font-size:18px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_img]:[padding:4px] [&_img]:[background:#fff] [background:#3FA47B]" >
          {j.logoUrl ? <img src={j.logoUrl} alt={`${j.company} logo`} /> : j.logo}
        </span>
        <motion.button
          onClick={() => toggleSave(j.id)}
          className={"save-btn [border:0] [background:transparent] [color:#9aa5b4] [padding:7px] [border-radius:7px] [&_:hover]:[color:#5570d3] [&_:hover]:[background:#f1f3ff] [.result-actions_&]:[border:1px_solid_#ebeff3] [transition-duration:180ms] [transition-timing-function:ease-out] [transition-property:transform,_color,_background-color] [&_:active]:[transform:scale(.9)] motion-reduce:[transition-duration:.01ms!important] " + (saved.includes(j.id) ? "saved [color:#267653] [background:#EAF5F0] [border-color:#3FA47B]" : "")}
          aria-label="Save job"
          whileTap={{ scale: 0.88 }}
          transition={quickSpring}
        >
          <Bookmark
            size={17}
            fill={saved.includes(j.id) ? "currentColor" : "none"}
          />
        </motion.button>
      </div>
      {j.featured && <span className="featured-tag [font-size:.75rem] [letter-spacing:.8px] [color:#267653] [background:#EAF5F0] [border-radius:4px] [padding:5px_7px] [display:inline-block] [margin-bottom:9px] [font-weight:700] [.result-title-row_&]:[margin:0] [line-height:1.35] [border-color:#c9e3d7]">FEATURED</span>}
      <h3 className="text-lg font-semibold text-[#172B25]">{j.title}</h3>
      <div className="job-company [display:flex] [gap:7px] [align-items:center] [color:#7f8a99] [font-size:11px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[color:#708098] [.home-featured_&]:[font-size:13px] [.home-featured_&]:[text-overflow:ellipsis] [.home-featured_&]:[white-space:nowrap]">
        {j.company}
        <span>·</span>
        {j.location}
      </div>
      <p className="job-desc [font-size:.875rem] [color:#8490a0] [line-height:1.6] [margin:14px_0] [display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [line-clamp:3] [.home-featured_&]:[min-height:70px] [.home-featured_&]:[margin:15px_0_17px] [.home-featured_&]:[color:#758399] [.home-featured_&]:[font-size:13px] [.home-featured_&]:[line-height:1.7]">{j.shortDescription || j.description}</p>
      <div className="job-tags [display:flex] [gap:7px] [flex-wrap:wrap] [&_span]:[padding:7px_9px] [&_span]:[border-radius:7px] [&_span]:[background:#F7F9F8] [&_span]:[color:#52645c] [&_span]:[font-size:11px] [.result-main_&]:[margin-bottom:10px] [&_span]:[line-height:1.5] [.home-featured_&]:[gap:8px] [&_span]:[border:1px_solid_#e9edf3] [&_span]:[border-color:#E5ECE8]">
        <span>{j.type}</span>
        <span>{j.mode}</span>
      </div>
      <div className="job-card-bottom [display:flex] [justify-content:space-between] [align-items:center] [border-top:1px_solid_#eff1f4] [padding-top:13px] [margin-top:17px] [.home-featured_&]:[margin-top:auto] [.home-featured_&]:[padding-top:16px] [.home-featured_&]:[border-color:#edf0f4] mt-auto [margin-top:auto]">
        <span className="salary [color:#364b6b] [font-weight:700] [font-size:14px] [line-height:1.5] [.home-featured_&]:[color:#267653] [.home-featured_&]:[font-size:14px]">{j.salary}</span>
        <Link href={"/jobs/" + j.id} className="job-link [display:flex] [align-items:center] [gap:5px] [font-size:14px] [color:#328A66] [font-weight:600] [line-height:1.5] [transition-duration:180ms] [transition-timing-function:ease-out] motion-reduce:[transition-duration:.01ms!important] [.home-featured_&]:[gap:6px] [.home-featured_&]:[color:#328A66] [.home-featured_&]:[font-size:13px] [&_:hover]:[color:#267653]">
          View role <ArrowRight size={15} />
        </Link>
      </div>
    </motion.article>
  );
}

export function JobsPage() {
  const { saved, toggleSave, apply } = useJobZ();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") || ""),
    [loc, setLoc] = useState(sp.get("location") || ""),
    [category, setCategory] = useState(sp.get("category") || "All"),
    [type, setType] = useState("All types"),
    [mode, setMode] = useState("Any mode"),
    [sort, setSort] = useState("recommended"),
    [salary, setSalary] = useState("All ranges"),
    [experience, setExperience] = useState("Any level"),
    [results, setResults] = useState<Job[]>([]),
    [categories, setCategories] = useState<{ name: string; count: number }[]>([]),
    [resultsTotal, setResultsTotal] = useState(0),
    [totalPages, setTotalPages] = useState(1),
    [page, setPage] = useState(1),
    [resultsLoading, setResultsLoading] = useState(true),
    [resultsError, setResultsError] = useState("");
  const animatedResultIds = useRef(new Set<string>());
  useEffect(() => {
    setQuery(sp.get("q") || "");
    setLoc(sp.get("location") || "");
    setCategory(sp.get("category") || "All");
    setPage(1);
  }, [sp]);
  useEffect(() => {
    let active = true;
    fetch("/api/categories", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) setCategories(data.categories || []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10", sort });
      if (query.trim()) params.set("search", query.trim());
      if (loc.trim()) params.set("location", loc.trim());
      if (category !== "All") params.set("category", category);
      if (type !== "All types") params.set("jobType", type.toLowerCase());
      if (mode !== "Any mode") params.set("workMode", mode === "On-site" ? "onsite" : mode.toLowerCase());
      if (experience !== "Any level") params.set("experience", experience);
      if (salary === "Under 50,000") params.set("salaryMax", "50000");
      if (salary === "50,000 and up") params.set("salaryMin", "50000");
      setResultsLoading(true);
      setResultsError("");
      try {
        const response = await fetch(`/api/jobs?${params}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load jobs.");
        if (active) {
          setResults((data.jobs as ApiJob[]).map(toJob));
          setResultsTotal(Number(data.pagination?.total) || 0);
          setTotalPages(Math.max(1, Number(data.pagination?.totalPages) || 1));
        }
      } catch (error) {
        if (active) setResultsError(error instanceof Error ? error.message : "Could not load jobs.");
      } finally {
        if (active) setResultsLoading(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [query, loc, category, type, mode, sort, salary, experience, page]);
  const filtered = results;
  useEffect(() => {
    filtered.forEach((job) => animatedResultIds.current.add(job.id));
  }, [filtered]);
  return (
    <>
      
      <main className="jobs-page [max-width:1160px] [margin:auto] [padding:60px_30px_92px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px] [background:#F7F9F8]">
        <div className="jobs-head [&_h1]:[font-size:clamp(2.25rem,_4vw,_2.75rem)] [&_h1]:[line-height:1.1] [&_h1]:[letter-spacing:-.04em] [&_h1]:[color:#172B25] [&_h1]:[margin:0_0_8px] [&_h1]:[font-weight:600] [display:flex] [justify-content:space-between] [align-items:flex-end] [margin-bottom:25px] [&_p]:[margin:0] [&_p]:[color:#8792a2] max-[700px]:[&_h1]:[font-size:clamp(2.25rem,_10vw,_2.75rem)] max-[700px]:[&_h1]:[letter-spacing:-.04em] max-[700px]:[align-items:flex-start] max-[700px]:[gap:1rem]">
          <div>
            <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">A BETTER FIT STARTS HERE</div>
            <AnimatedHeading as="h1">
              Find work that <span className="serif-accent [font-family:inherit] [font-weight:400] [font-style:italic] [color:#328A66] [letter-spacing:-2px] [.home-hero_&]:[color:#328A66] [.home-hero_&]:[font-style:italic] [.home-hero_&]:[letter-spacing:-.06em] [.auth-aside_&]:[color:#8ed0ad]">fits.</span>
            </AnimatedHeading>
            <p className="text-sm leading-6 text-[#71817A]">Good opportunities, from teams you’ll be glad to join.</p>
          </div>
          <div className="jobs-count [display:grid] [text-align:right] [gap:3px] [color:#8792a2] [font-size:14px] [&_b]:[font-size:21px] [&_b]:[color:#344763] max-[700px]:[display:none] [line-height:1.5]">
            <b>{filtered.length}</b>
            <span>open roles</span>
          </div>
        </div>
        <motion.form
          className="searchbar [display:flex] [align-items:center] [background:white] [border:1px_solid_#e7ebf0] [box-shadow:0_11px_33px_#29416e12] [border-radius:10px] [padding:7px] [max-width:650px] [gap:10px] max-[700px]:[flex-wrap:wrap] max-[700px]:[padding:8px] max-[420px]:[flex-wrap:wrap] [.home-hero_&]:[max-width:650px] [.home-hero_&]:[gap:6px] [.home-hero_&]:[padding:8px] [.home-hero_&]:[border-color:#e5eaf2] [.home-hero_&]:[border-radius:15px] [.home-hero_&]:[box-shadow:0_18px_48px_rgb(27_50_82_/_10%)] max-[600px]:[.home-hero_&]:[gap:2px] max-[600px]:[.home-hero_&]:[padding:7px] [border-color:#E5ECE8] jobs-search [max-width:none] [margin-bottom:27px] max-[700px]:[gap:4px] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="search-field [display:flex] [align-items:center] [gap:11px] [padding:0_12px] [color:#8592a6] [flex:1] [min-width:0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[width:100%] [&_input]:[height:48px] [&_input]:[color:#263b58] [&_input]:[background:transparent] [&_input]:[font-size:14px] [&_input::placeholder]:[color:#a0a9b6] max-[700px]:[min-width:calc(50%_-_10px)] max-[700px]:[.jobs-search_&]:[min-width:100%] [&_input:focus]:[border-color:#3FA47B] [.home-hero_&]:[min-height:54px] [.home-hero_&]:[gap:12px] [.home-hero_&]:[padding:0_14px] [&>_svg]:[flex:0_0_auto] [&>_svg]:[color:#7184a2] max-[600px]:[.home-hero_&]:[min-width:100%] max-[600px]:[.home-hero_&]:[min-height:46px] max-[600px]:[&_input]:[height:40px] [&_:focus-within]:[border-color:#3FA47B]">
            <Search size={18} />
            <input
              value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Role, company, or keyword"
             className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"/>
          </div>
          <div className="search-divider [width:1px] [height:28px] [background:#edf0f3] max-[700px]:[display:none] [.home-hero_&]:[height:34px] [.home-hero_&]:[background:#e8edf4]" />
          <div className="search-field [display:flex] [align-items:center] [gap:11px] [padding:0_12px] [color:#8592a6] [flex:1] [min-width:0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[width:100%] [&_input]:[height:48px] [&_input]:[color:#263b58] [&_input]:[background:transparent] [&_input]:[font-size:14px] [&_input::placeholder]:[color:#a0a9b6] max-[700px]:[min-width:calc(50%_-_10px)] max-[700px]:[.jobs-search_&]:[min-width:100%] [&_input:focus]:[border-color:#3FA47B] [.home-hero_&]:[min-height:54px] [.home-hero_&]:[gap:12px] [.home-hero_&]:[padding:0_14px] [&>_svg]:[flex:0_0_auto] [&>_svg]:[color:#7184a2] max-[600px]:[.home-hero_&]:[min-width:100%] max-[600px]:[.home-hero_&]:[min-height:46px] max-[600px]:[&_input]:[height:40px] [&_:focus-within]:[border-color:#3FA47B]">
            <MapPin size={18} />
            <input
              value={loc}
                onChange={(e) => { setLoc(e.target.value); setPage(1); }}
              placeholder="Location or remote"
             className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"/>
          </div>
          <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]">
            <Search size={16} /> Search
          </button>
        </motion.form>
        <div className="jobs-layout [display:grid] [grid-template-columns:235px_1fr] [gap:25px] max-[700px]:[grid-template-columns:1fr] max-[900px]:[grid-template-columns:minmax(190px,_230px)_minmax(0,_1fr)] max-[900px]:[gap:1.25rem]">
          <motion.aside
  className="filters sticky top-[70px] self-start [border:1px_solid_#edf0f3] [border-radius:.75rem] [padding:17px] [height:max-content] ..."
>    <div className="filter-title [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:21px] [&_b]:[display:flex] [&_b]:[align-items:center] [&_b]:[gap:8px] [&_b]:[font-size:14px] [&_button]:[background:none] [&_button]:[border:0] [&_button]:[color:#328A66] [&_button]:[font-size:15px] max-[700px]:[grid-column:1/-1] [&_b]:[line-height:1.5] [&_button]:[line-height:1.5] [&_button:hover]:[color:#267653]">
              <b>
                <Filter size={17} /> Filters
              </b>
              <button
                onClick={() => {
                  setCategory("All");
                  setType("All types");
                  setMode("Any mode");
                  setQuery("");
                  setLoc("");
                  setSalary("All ranges");
                  setExperience("Any level");
                  setSort("recommended");
                  setPage(1);
                }}
               className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3FA47B]">
                Clear all
              </button>
            </div>
            <label className="filter-label [display:grid] [gap:8px] [color:#7f8b9d] [font-size:14px] [letter-spacing:.7px] [font-weight:700] [margin:17px_0] [&_select]:[width:100%] [&_select]:[padding:10px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [line-height:1.5] [&_input:checked_+_span]:[color:#267653]">
              CATEGORY
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
               className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
                <option>All</option>
                {categories.map(({ name }) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="filter-label [display:grid] [gap:8px] [color:#7f8b9d] [font-size:14px] [letter-spacing:.7px] [font-weight:700] [margin:17px_0] [&_select]:[width:100%] [&_select]:[padding:10px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [line-height:1.5] [&_input:checked_+_span]:[color:#267653]">
              JOB TYPE
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
                {[
                  "All types",
                  "Full-time",
                  "Part-time",
                  "Contract",
                  "Internship",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="filter-label [display:grid] [gap:8px] [color:#7f8b9d] [font-size:14px] [letter-spacing:.7px] [font-weight:700] [margin:17px_0] [&_select]:[width:100%] [&_select]:[padding:10px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [line-height:1.5] [&_input:checked_+_span]:[color:#267653]">
              WORK STYLE
              <select value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
                {["Any mode", "Remote", "Hybrid", "On-site"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
                      <label className="filter-label [display:grid] [gap:8px] [color:#7f8b9d] [font-size:14px] [letter-spacing:.7px] [font-weight:700] [margin:17px_0] [&_select]:[width:100%] [&_select]:[padding:10px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [line-height:1.5]">
              SALARY
              <select value={salary} onChange={(event) => { setSalary(event.target.value); setPage(1); }} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
                {["All ranges", "Under 50,000", "50,000 and up"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="filter-label [display:grid] [gap:8px] [color:#7f8b9d] [font-size:14px] [letter-spacing:.7px] [font-weight:700] [margin:17px_0] [&_select]:[width:100%] [&_select]:[padding:10px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [line-height:1.5]">
              EXPERIENCE
              <select value={experience} onChange={(event) => { setExperience(event.target.value); setPage(1); }} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
                {["Any level", "Entry", "Mid", "Senior"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label></motion.aside>
          <section className="job-results">
            <div className="results-top [&_select]:[width:125px] [&_select]:[padding:7px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [display:flex] [justify-content:space-between] [align-items:center] [color:#8792a2] [font-size:14px] [margin:0_0_12px] [&_b]:[color:#40516a] [&_label]:[display:flex] [&_label]:[align-items:center] [&_label]:[gap:8px] max-[700px]:[.jobs-layout_&]:[margin-top:4px] [line-height:1.5]">
              <span>
                Showing <b>{resultsTotal} opportunities</b>
              </span>
              <label className="grid gap-2 text-sm font-medium text-[#172B25]">
                Sort by
                <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
                  <option value="recommended">Recommended</option>
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="salaryHigh">Salary: high to low</option>
                  <option value="salaryLow">Salary: low to high</option>
                </select>
              </label>
            </div>
            {resultsLoading ? (
              <p role="status" className="text-sm leading-6 text-[#71817A]">Loading jobs…</p>
            ) : resultsError ? (
              <p role="alert" className="text-sm leading-6 text-[#71817A]">{resultsError}</p>
            ) : filtered.length ? (
              <div className="results-list [display:grid] [gap:10px]">
                {filtered.map((j, index) => {
                  const shouldAnimate = !animatedResultIds.current.has(j.id);
                  animatedResultIds.current.add(j.id);
                  return (
                  <motion.article
                    className="result-card [display:grid] [grid-template-columns:44px_1fr_auto] [gap:15px] [border:1px_solid_#ebeff3] [border-radius:.75rem] [padding:17px] [background:#fff] max-[700px]:[grid-template-columns:42px_minmax(0,_1fr)] max-[700px]:[gap:12px] max-[700px]:[padding:13px] [border-color:#E5ECE8] max-[420px]:[padding:14px] [&_:hover]:[border-color:#c9e3d7] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]"
                    key={j.id}
                    initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: shouldAnimate ? Math.min(index * 0.035, 0.14) : 0 }}
                  >
                    <span
                      className="company-logo [display:grid] [place-items:center] [width:42px] [height:42px] [border-radius:11px] [color:#fff] [font-weight:700] [font-size:17px] max-[700px]:[.result-card>_&]:[width:36px] max-[700px]:[.result-card>_&]:[height:36px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[width:52px] [.home-featured_&]:[height:52px] [.home-featured_&]:[border:1px_solid_#edf0f5] [.home-featured_&]:[border-radius:14px] [.home-featured_&]:[font-size:18px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_img]:[padding:4px] [&_img]:[background:#fff] [background:#3FA47B]"
                      
                    >
                      {j.logo}
                    </span>
                    <div className="result-main [&_h3]:[font-size:1.125rem] [&_h3]:[color:#2e4059] [&_h3]:[margin:0] [&>p]:[font-size:.875rem] [&>p]:[color:#8590a0] [&>p]:[line-height:1.6] [&>p]:[margin:10px_0] max-[700px]:[min-width:0] max-[700px]:[&>p]:[font-size:10px] [&_h3]:[line-height:1.35] [&>_p]:[display:-webkit-box] [&>_p]:[overflow:hidden] [&>_p]:[-webkit-box-orient:vertical] [&>_p]:[-webkit-line-clamp:3] [&>_p]:[line-clamp:3]">
                      <div className="result-title-row [display:flex] [align-items:center] [gap:10px] max-[700px]:[flex-wrap:wrap] max-[700px]:[&_h3]:[font-size:12px]">
                        <Link href={"/jobs/" + j.id}>
                          <h3 className="text-lg font-semibold text-[#172B25]">{j.title}</h3>
                        </Link>
                        {j.featured && (
                          <span className="featured-tag [font-size:.75rem] [letter-spacing:.8px] [color:#267653] [background:#EAF5F0] [border-radius:4px] [padding:5px_7px] [display:inline-block] [margin-bottom:9px] [font-weight:700] [.result-title-row_&]:[margin:0] [line-height:1.35] [border-color:#c9e3d7]">FEATURED</span>
                        )}
                      </div>
                      <div className="job-company [display:flex] [gap:7px] [align-items:center] [color:#7f8a99] [font-size:11px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[color:#708098] [.home-featured_&]:[font-size:13px] [.home-featured_&]:[text-overflow:ellipsis] [.home-featured_&]:[white-space:nowrap]">
                        {j.company}
                        <span>·</span>
                        {j.location}
                        <span>·</span>
                        {j.posted}
                      </div>
                      <p className="job-desc [font-size:.875rem] [color:#8490a0] [line-height:1.6] [margin:14px_0] [display:-webkit-box] [overflow:hidden] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [line-clamp:3] [.home-featured_&]:[min-height:70px] [.home-featured_&]:[margin:15px_0_17px] [.home-featured_&]:[color:#758399] [.home-featured_&]:[font-size:13px] [.home-featured_&]:[line-height:1.7]">{j.shortDescription || j.description}</p>
                      <div className="job-tags [display:flex] [gap:7px] [flex-wrap:wrap] [&_span]:[padding:7px_9px] [&_span]:[border-radius:7px] [&_span]:[background:#F7F9F8] [&_span]:[color:#52645c] [&_span]:[font-size:11px] [.result-main_&]:[margin-bottom:10px] [&_span]:[line-height:1.5] [.home-featured_&]:[gap:8px] [&_span]:[border:1px_solid_#e9edf3] [&_span]:[border-color:#E5ECE8]">
                        <span>{j.type}</span>
                        <span>{j.mode}</span>
                        <span>{j.category}</span>
                      </div>
                      <div className="salary [color:#364b6b] [font-weight:700] [font-size:14px] [line-height:1.5] [.home-featured_&]:[color:#267653] [.home-featured_&]:[font-size:14px]">{j.salary}</div>
                    </div>
                    <div className="result-actions [display:flex] [align-items:flex-start] [gap:7px] max-[700px]:[grid-column:2] max-[700px]:[justify-content:flex-end] max-[700px]:[align-items:center] max-[700px]:[flex-wrap:wrap]">
                      <button
                        onClick={() => toggleSave(j.id)}
                        className={
                          "save-btn [border:0] [background:transparent] [color:#9aa5b4] [padding:7px] [border-radius:7px] [&_:hover]:[color:#5570d3] [&_:hover]:[background:#f1f3ff] [.result-actions_&]:[border:1px_solid_#ebeff3] [transition-duration:180ms] [transition-timing-function:ease-out] [transition-property:transform,_color,_background-color] [&_:active]:[transform:scale(.9)] motion-reduce:[transition-duration:.01ms!important] " + (saved.includes(j.id) ? "saved [color:#267653] [background:#EAF5F0] [border-color:#3FA47B]" : "")
                        }
                      >
                        <Bookmark
                          size={17}
                          fill={saved.includes(j.id) ? "currentColor" : "none"}
                        />
                      </button>
                      <Link
                        href={"/jobs/" + j.id}
                        className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc] btn-sm [padding:8px_13px] [font-size:.75rem] [min-height:38px]"
                      >
                        View role
                      </Link>
                    </div>
                  </motion.article>
                  );
                })}
              </div>
            ) : (
              <motion.div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <Search size={28} />
                <h3 className="text-lg font-semibold text-[#172B25]">No roles found yet</h3>
                <p className="text-sm leading-6 text-[#71817A]">Try adjusting your filters or broadening your search.</p>
                <button
                  className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]"
                  onClick={() => {
                    setCategory("All");
                    setType("All types");
                    setMode("Any mode");
                    setQuery("");
                    setLoc("");
                  setSalary("All ranges");
                  setExperience("Any level");
                  setSort("recommended");
                  setPage(1);
                  }}
                >
                  Clear filters
                </button>
              </motion.div>
            )}
            {totalPages > 1 && <nav aria-label="Job result pages" className="mt-6 flex items-center justify-between gap-4">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 rounded-xl border border-[#E5ECE8] bg-white px-4 text-sm font-semibold text-[#267653] disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <span className="text-sm text-[#71817A]">Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-xl border border-[#E5ECE8] bg-white px-4 text-sm font-semibold text-[#267653] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </nav>}          </section>
        </div>
      </main>
      
    </>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { jobs: allJobs, saved, toggleSave, apply } = useJobZ();
  const [job, setJob] = useState<Job | null>(null);
  const [jobError, setJobError] = useState("");
  const [modal, setModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    let current = true;

    async function loadJob() {
      setJob(null);
      setJobError("");
      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not load this job.");
        }
        if (current) setJob(toJob(result.job as ApiJob));
      } catch (error) {
        if (current) {
          setJobError(
            error instanceof Error ? error.message : "Could not load this job.",
          );
        }
      }
    }

    void loadJob();
    return () => {
      current = false;
    };
  }, [id]);

  if (!job) {
    return (
      <>
        
        <main className="detail-page [max-width:1100px] [margin:auto] [padding:32px_30px_90px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px]" aria-live="polite">
          {jobError ? jobError : "Loading job details…"}
          {jobError && <p className="text-sm leading-6 text-[#71817A]"><Link href="/jobs">Browse all jobs</Link></p>}
        </main>
        
      </>
    );
  }
  return (
    <>
      
      <main className="detail-page [max-width:1100px] [margin:auto] [padding:32px_30px_90px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px]">
        <Link href="/jobs" className="back-link [display:block] [color:#6e7c91] [font-size:14px] [margin:5px_0_24px] [.auth-form>_&]:[margin-bottom:45px] [&_)]:[color:#328A66] max-[700px]:[.auth-form>_&]:[margin-bottom:35px] [line-height:1.5] [&_):hover]:[color:#267653]">
          ← All opportunities
        </Link>
        <div className="detail-grid [display:grid] [grid-template-columns:1fr_300px] [gap:42px] max-[700px]:[grid-template-columns:1fr] max-[700px]:[gap:20px]">
          <section>
            <div className="detail-company [display:flex] [align-items:center] [gap:16px] [&_h1]:[margin:0_0_6px] [&_h1]:[font-size:clamp(1.75rem,_3vw,_2.25rem)] [&_h1]:[letter-spacing:-.7px] [&_h1]:[color:#253a59] [&_p]:[color:#7d8999] [&_p]:[margin:0] [&_p]:[font-size:14px] [&_p_span]:[margin:0_5px] max-[700px]:[align-items:flex-start] max-[700px]:[&_h1]:[font-size:21px] [&_h1]:[line-height:1.2] [&_p]:[line-height:1.5]">
              <span
                className="company-logo [display:grid] [place-items:center] [width:42px] [height:42px] [border-radius:11px] [color:#fff] [font-weight:700] [font-size:17px] max-[700px]:[.result-card>_&]:[width:36px] max-[700px]:[.result-card>_&]:[height:36px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[width:52px] [.home-featured_&]:[height:52px] [.home-featured_&]:[border:1px_solid_#edf0f5] [.home-featured_&]:[border-radius:14px] [.home-featured_&]:[font-size:18px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_img]:[padding:4px] [&_img]:[background:#fff] [background:#3FA47B] big [width:58px] [height:58px] [font-size:23px]"
                
              >
                {job.logo}
              </span>
              <div>
                <AnimatedHeading as="h1">{job.title}</AnimatedHeading>
                <p className="text-sm leading-6 text-[#71817A]">
                  {job.company} <span>·</span> {job.location}
                </p>
              </div>
            </div>
            <div className="detail-actions [display:flex] [gap:9px] [padding:24px_0] [border-bottom:1px_solid_#eff1f4] max-[700px]:[flex-wrap:wrap]">
              <button
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]"
                onClick={() => setModal(true)}
              >
                Apply for this role <ArrowRight size={16} />
              </button>
              <button
                className={
                  "btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc] " + (saved.includes(job.id) ? "saved [color:#267653] [background:#EAF5F0] [border-color:#3FA47B]" : "")
                }
                onClick={() => toggleSave(job.id)}
              >
                <Bookmark size={16} />
                {saved.includes(job.id) ? "Saved" : "Save role"}
              </button>
              <button
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]"
                onClick={() => {
                  navigator.clipboard?.writeText(location.href);
                  alert("Link copied to clipboard");
                }}
              >
                Share
              </button>
            </div>
            <div className="detail-content [padding-top:10px] [color:#69778a] [font-size:16px] [line-height:1.65] [&_h2]:[color:#2a3f5d] [&_h3]:[color:#2a3f5d] [&_h2]:[font-size:1.25rem] [&_h2]:[margin:17px_0_10px] [&_h3]:[font-size:var(--type-subheading)] [&_h3]:[margin:25px_0_7px] [&_ul]:[padding-left:20px] [&_li]:[padding:3px_0] [&_h2]:[line-height:1.3] [&_h3]:[line-height:1.4]">
              <h2 className="text-2xl font-semibold tracking-tight text-[#172B25]">About this role</h2>
              <p className="text-sm leading-6 text-[#71817A]">{job.description}</p>
              {!!job.responsibilities?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">What you’ll do</h3>
                  <ul>{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
                </>
              )}
              {!!job.requirements?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">What you’ll bring</h3>
                  <ul>{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
                </>
              )}
              {!!job.skills?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">Skills for this role</h3>
                  <div className="flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-full border border-[#E5ECE8] bg-[#F7F9F8] px-3 py-1.5 text-sm text-[#52645c]">{skill}</span>)}</div>
                </>
              )}
              {job.companyDescription && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">About {job.company}</h3>
                  <p className="text-sm leading-6 text-[#71817A]">{job.companyDescription}</p>
                </>
              )}
              {!!job.benefits?.length && (
                <>
                  <h3 className="text-lg font-semibold text-[#172B25]">Benefits</h3>
                  <div className="benefit-pills [display:flex] [gap:8px] [flex-wrap:wrap] [&_span]:[border:1px_solid_#e8ecf1] [&_span]:[padding:7px_10px] [&_span]:[border-radius:5px] [&_span]:[font-size:14px] [&_span]:[line-height:1.5]">
                    {job.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}
                  </div>
                </>
              )}
            </div>
          </section>
          <aside className="detail-sidebar max-[700px]:[grid-row:1] [&>_*]:[background-color:#fff] [&>_*]:[border-color:#E5ECE8]">
            <div className="summary-card [border:1px_solid_#e9edf2] [border-radius:.75rem] [padding:18px] [&>b]:[font-size:21px] [&>div]:[display:flex] [&>div]:[gap:11px] [&>div]:[align-items:center] [&>div]:[padding:15px_0] [&>div]:[border-bottom:1px_solid_#eff1f4] [&>div]:[color:#6780b8] [&>div_svg]:[width:17px] [&>div_span]:[display:grid] [&>div_span]:[gap:4px] [&>div_span]:[font-size:14px] [&>div_span]:[color:#42536d] [&>div_small]:[font-size:14px] [&>div_small]:[color:#8d98a7] max-[700px]:[display:grid] max-[700px]:[grid-template-columns:1fr_1fr] max-[700px]:[gap:0_10px] max-[700px]:[&>b]:[grid-column:1/-1] max-[700px]:[&>div]:[border:0] [&>b]:[line-height:1.35] [&>div_span]:[line-height:1.5] [&>div_small]:[line-height:1.5] [border-color:#E5ECE8] [background-color:#fff] [&>_div]:[color:#328A66] [background:#fff]">
              <b>At a glance</b>
              <div>
                <Clock3 />
                <span>
                  <small>Employment</small>
                  {job.type}
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  <small>Location</small>
                  {job.location}
                </span>
              </div>
              <div>
                <BriefcaseBusiness />
                <span>
                  <small>Work style</small>
                  {job.mode}
                </span>
              </div>
              <div>
                <Zap />
                <span>
                  <small>Compensation</small>
                  {job.salary}
                </span>
              </div>
              <div>
                <Compass />
                <span>
                  <small>Experience</small>{job.experienceLevel || "Not specified"}
                </span>
              </div>
              {job.applicationDeadline && <div>
                <Clock3 />
                <span><small>Apply by</small>{new Date(job.applicationDeadline).toLocaleDateString()}</span>
              </div>}
              <button
                className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)] btn-wide [width:100%]"
                onClick={() => setModal(true)}
              >
                Apply now <ArrowRight size={16} />
              </button>
            </div>
            <div className="help-card [border:1px_solid_#e9edf2] [border-radius:.75rem] [padding:18px] [margin-top:13px] [background:#f8f9fc] [&>svg]:[color:#6279c9] [&_b]:[display:block] [&_b]:[margin:9px_0_5px] [&_b]:[font-size:12px] [&_p]:[font-size:16px] [&_p]:[color:#8792a2] [&_a]:[color:#328A66] [&_a]:[font-size:14px] [&_a]:[font-weight:600] max-[700px]:[display:none] [&_p]:[line-height:1.65] [&_a]:[line-height:1.5] [border-color:#E5ECE8] [&_a:hover]:[color:#267653] [&>_svg]:[color:#328A66]">
              <CircleHelp />
              <b>Questions about JobZ?</b>
              <p className="text-sm leading-6 text-[#71817A]">Contact our support team for help with your application.</p>
              <Link href="/contact">Contact support →</Link>
            </div>
          </aside>
        </div>
      </main>
      {allJobs.some((related) => related.id !== job.id && related.category === job.category) && <section aria-labelledby="related-jobs" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#328A66]">Keep exploring</p><h2 id="related-jobs" className="mt-2 text-2xl font-semibold tracking-tight text-[#172B25]">Related opportunities</h2></div>
          <Link href="/jobs" className="text-sm font-semibold text-[#328A66] hover:text-[#267653]">Browse all jobs</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{allJobs.filter((related) => related.id !== job.id && related.category === job.category).slice(0, 3).map((related) => <JobCard key={related.id} job={related} homeCard />)}</div>
      </section>}
      <AnimatePresence>
      {modal && (
        <motion.div className="modal-backdrop [position:fixed] [inset:0] [background:#10213a88] [z-index:20] [display:grid] [place-items:center] [padding:20px] motion-safe-enter [@media(scripting:none)]:[opacity:1!important] [@media(scripting:none)]:[filter:none!important] [@media(scripting:none)]:[transform:none!important]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)}>
          <motion.div className="modal [position:relative] [background:#fff] [border-radius:14px] [padding:30px] [width:min(475px,100%)] [box-shadow:0_25px_90px_#101d3933] [&_h2]:[font-size:var(--type-card-heading)] [&_h2]:[color:#263b5a] [&_h2]:[margin:3px_0_8px] [&>p]:[color:#7c8999] [&>p]:[font-size:16px] [&>p]:[line-height:1.65] [&_textarea]:[width:100%] [&_textarea]:[height:95px] [&_textarea]:[resize:vertical] [&_textarea]:[padding:11px] [&_textarea]:[border:1px_solid_#e5e9ee] [&_textarea]:[border-radius:7px] [&_textarea]:[margin:10px_0] [&_h2]:[line-height:1.3] [background-color:#fff] [border-color:#E5ECE8]" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close [position:absolute] [right:15px] [top:15px] [background:white] [border:0] [color:#8793a1]" onClick={() => setModal(false)}>
              <X />
            </button>
            <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">MAKE YOUR NEXT MOVE</div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#172B25]">Apply to {job.company}</h2>
            <p className="text-sm leading-6 text-[#71817A]">
              Applying for <b>{job.title}</b>. Add a quick note to introduce
              yourself.
            </p>
            <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">Cover letter<textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" value={coverLetter} onChange={(event)=>setCoverLetter(event.target.value)} maxLength={10000} placeholder="Introduce yourself to the employer" /></label>
            <label className="input-label [display:grid] [gap:8px] [font-size:14px] [color:#42536a] [font-weight:600] [margin:15px_0] [line-height:1.45]">Resume URL (optional)<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" type="url" value={resumeUrl} onChange={(event)=>setResumeUrl(event.target.value)} placeholder="https://…" /></label>
            <button
              className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)] btn-wide [width:100%]"
              onClick={() => {
                apply(job, { coverLetter, resumeUrl });
                setModal(false);
              }}
            >
              Send application <ArrowRight size={16} />
            </button>
            <small className="modal-foot [display:block] [text-align:center] [color:#929ba7] [font-size:9px] [margin-top:12px]">
              Your information stays private and is only shared with this
              employer.
            </small>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      
    </>
  );
}
