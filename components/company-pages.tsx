"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Users } from "lucide-react";
import { JobCard } from "@/components/site";
import { toJob, type ApiJob, type Job } from "@/data/jobs";

type Company = {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
  companySize: string;
  description: string;
  website?: string;
  socialLinks?: { linkedin?: string; facebook?: string; instagram?: string };
  jobCount: number;
};

function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/companies", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Could not load companies.");
        if (active) setCompanies(result.companies || []);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load companies.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { companies, loading, error };
}

export function CompaniesDirectory() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [location, setLocation] = useState("All locations");
  const { companies, loading, error } = useCompanies();
  const filtered = companies.filter((company) =>
    `${company.name} ${company.industry} ${company.location}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  ).filter((company) => (industry === "All industries" || company.industry === industry) && (location === "All locations" || company.location === location));
  const industries = [...new Set(companies.map((company) => company.industry).filter(Boolean))].sort();
  const locations = [...new Set(companies.map((company) => company.location).filter(Boolean))].sort();
  return (
    <>
      
      <main className="jobs-page [max-width:1160px] [margin:auto] [padding:60px_30px_92px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px] [background:#F7F9F8]">
        <div className="jobs-head [&_h1]:[font-size:clamp(2.25rem,_4vw,_2.75rem)] [&_h1]:[line-height:1.1] [&_h1]:[letter-spacing:-.04em] [&_h1]:[color:#172B25] [&_h1]:[margin:0_0_8px] [&_h1]:[font-weight:600] [display:flex] [justify-content:space-between] [align-items:flex-end] [margin-bottom:25px] [&_p]:[margin:0] [&_p]:[color:#8792a2] max-[700px]:[&_h1]:[font-size:clamp(2.25rem,_10vw,_2.75rem)] max-[700px]:[&_h1]:[letter-spacing:-.04em] max-[700px]:[align-items:flex-start] max-[700px]:[gap:1rem]">
          <div>
            <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">EMPLOYER DIRECTORY</div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#172B25] sm:text-4xl">
              Meet your <span className="serif-accent [font-family:inherit] [font-weight:400] [font-style:italic] [color:#328A66] [letter-spacing:-2px] [.home-hero_&]:[color:#328A66] [.home-hero_&]:[font-style:italic] [.home-hero_&]:[letter-spacing:-.06em] [.auth-aside_&]:[color:#8ed0ad]">future team.</span>
            </h1>
            <p className="text-sm leading-6 text-[#71817A]">Explore company profiles and their active opportunities.</p>
          </div>
        </div>
        <div className="mb-7 grid max-w-3xl gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#52645c]">Industry
            <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="min-h-11 rounded-xl border border-[#E5ECE8] bg-white px-3 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
              <option>All industries</option>{industries.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#52645c]">Location
            <select value={location} onChange={(event) => setLocation(event.target.value)} className="min-h-11 rounded-xl border border-[#E5ECE8] bg-white px-3 text-sm text-[#172B25] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20">
              <option>All locations</option>{locations.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="searchbar [display:flex] [align-items:center] [background:white] [border:1px_solid_#e7ebf0] [box-shadow:0_11px_33px_#29416e12] [border-radius:10px] [padding:7px] [max-width:650px] [gap:10px] max-[700px]:[flex-wrap:wrap] max-[700px]:[padding:8px] max-[420px]:[flex-wrap:wrap] [.home-hero_&]:[max-width:650px] [.home-hero_&]:[gap:6px] [.home-hero_&]:[padding:8px] [.home-hero_&]:[border-color:#e5eaf2] [.home-hero_&]:[border-radius:15px] [.home-hero_&]:[box-shadow:0_18px_48px_rgb(27_50_82_/_10%)] max-[600px]:[.home-hero_&]:[gap:2px] max-[600px]:[.home-hero_&]:[padding:7px] [border-color:#E5ECE8] jobs-search [max-width:none] [margin-bottom:27px] max-[700px]:[gap:4px]">
          <div className="search-field [display:flex] [align-items:center] [gap:11px] [padding:0_12px] [color:#8592a6] [flex:1] [min-width:0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[width:100%] [&_input]:[height:48px] [&_input]:[color:#263b58] [&_input]:[background:transparent] [&_input]:[font-size:14px] [&_input::placeholder]:[color:#a0a9b6] max-[700px]:[min-width:calc(50%_-_10px)] max-[700px]:[.jobs-search_&]:[min-width:100%] [&_input:focus]:[border-color:#3FA47B] [.home-hero_&]:[min-height:54px] [.home-hero_&]:[gap:12px] [.home-hero_&]:[padding:0_14px] [&>_svg]:[flex:0_0_auto] [&>_svg]:[color:#7184a2] max-[600px]:[.home-hero_&]:[min-width:100%] max-[600px]:[.home-hero_&]:[min-height:46px] max-[600px]:[&_input]:[height:40px] [&_:focus-within]:[border-color:#3FA47B]">
            <Building2 />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search companies, industries, or locations"
             className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"/>
          </div>
        </div>
        {loading ? (
          <p role="status" className="text-sm leading-6 text-[#71817A]">Loading companies…</p>
        ) : error ? (
          <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]" role="alert">
            {error}
          </div>
        ) : filtered.length ? (
          <div className="company-grid [display:grid] [grid-template-columns:repeat(3,1fr)] [gap:14px] max-[700px]:[grid-template-columns:1fr]">
            {filtered.map((company) => (
              <article className="company-card [border:1px_solid_#e9edf2] [border-radius:.75rem] [overflow:hidden] [position:relative] [transition:transform_.2s] [&_:hover]:[transform:translateY(-3px)] [&_h3]:[margin:0_0_5px] [&_h3]:[font-size:21px] [&_h3]:[color:#30435f] [&_h3]:[line-height:1.35] [border-color:#E5ECE8] [background-color:#fff] [background:#fff]" key={company.id}>
                <div className="company-cover [height:72px] [background:linear-gradient(110deg,#EAF5F0,#F7F9F8_55%,#E2F1E9)]" />
                <div className="company-card-logo [position:absolute] [top:45px] [left:18px] [width:50px] [height:50px] [border:3px_solid_white] [border-radius:12px] [display:grid] [place-items:center] [color:#267653] [font-size:19px] [font-weight:700] [background:#EAF5F0] [border-color:#E5ECE8]">
                  {company.logo ? (
                    <img src={company.logo} alt={`${company.name} logo`} />
                  ) : (
                    company.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="company-card-content [padding:30px_18px_16px] [&>p]:[color:#8290a0] [&>p]:[font-size:.875rem] [&>p]:[display:flex] [&>p]:[align-items:center] [&>p]:[gap:7px] [&>p_i]:[width:3px] [&>p_i]:[height:3px] [&>p_i]:[border-radius:50%] [&>p_i]:[background:#a6afbb] [&>p]:[line-height:1.6]">
                  <h3 className="text-lg font-semibold text-[#172B25]">{company.name}</h3>
                  <p className="text-sm leading-6 text-[#71817A]">
                    {company.industry || "Industry not provided"}
                    {company.location ? ` · ${company.location}` : ""}
                  </p>
                  {company.companySize && (
                    <div className="company-size [display:flex] [align-items:center] [gap:7px] [font-size:14px] [color:#778599] [margin:15px_0] [line-height:1.5]">
                      <Users size={14} />
                      {company.companySize}
                    </div>
                  )}
                  <div className="company-card-bottom [border-top:1px_solid_#eff1f4] [padding-top:12px] [display:flex] [justify-content:space-between] [align-items:center] [color:#748198] [font-size:14px] [line-height:1.5]">
                    <span>
                      {company.jobCount} active{" "}
                      {company.jobCount === 1 ? "job" : "jobs"}
                    </span>
                    <Link
                      href={`/companies/${company.id}`}
                      className="text-link [display:inline-flex] [align-items:center] [gap:8px] [color:#328A66] [font-weight:600] [font-size:15px] [&_:hover]:[color:#267653] [.momentum-panel>_&]:[font-size:9px] max-[700px]:[.section-heading>_&]:[font-size:0] max-[700px]:[.section-heading>_&]:[white-space:nowrap] max-[700px]:[.section-heading>_&]:[margin-top:30px] max-[700px]:[&_svg]:[width:20px] max-[700px]:[&_svg]:[height:20px] [line-height:1.5] [body_.momentum-panel>_&]:[font-size:14px] [body_.momentum-panel>_&]:[line-height:1.5] [transition-duration:180ms] [transition-timing-function:ease-out] motion-reduce:[transition-duration:.01ms!important] max-[420px]:[.section-heading_>_&]:[align-self:flex-start] [.home-section-heading_>_&]:[flex:0_0_auto] [.home-section-heading_>_&]:[margin-bottom:4px] [.home-section-heading_>_&]:[color:#328A66] [.home-section-heading_>_&]:[font-size:13px] [.home-companies_.company-home-bottom_&]:[font-size:12px] max-[600px]:[.home-section-heading_>_&]:[margin:0] max-[600px]:[.home-section-heading_>_&]:[font-size:12px] [.home-companies_.company-home-bottom_&]:[color:#328A66]"
                    >
                      View company <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">
            <Building2 />
            <h3 className="text-lg font-semibold text-[#172B25]">
              {query
                ? "No companies match your search"
                : "No company profiles yet"}
            </h3>
            <p className="text-sm leading-6 text-[#71817A]">
              {query
                ? "Try another company name, industry, or location."
                : "Company profiles will appear here when employers add them."}
            </p>
          </div>
        )}
      </main>
      
    </>
  );
}

export function CompanyDetails({ id }: { id: string }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openings, setOpenings] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch(`/api/companies/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load company profile.");
        if (active) setCompany(result.company as Company);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load company profile."); })
      .finally(() => { if (active) setLoading(false); });
    fetch(`/api/jobs?companyId=${encodeURIComponent(id)}&limit=50&sort=latest`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && active) setOpenings((result.jobs as ApiJob[]).map(toJob));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setJobsLoading(false); });
    return () => { active = false; };
  }, [id]);
  return (
    <>
      
      <main className="jobs-page [max-width:1160px] [margin:auto] [padding:60px_30px_92px] max-[700px]:[padding:2rem_20px_4rem] [padding-top:clamp(2rem,_5vw,_3.75rem)] max-[420px]:[padding-left:16px] max-[420px]:[padding-right:16px] [background:#F7F9F8]">
        <Link href="/companies" className="back-link [display:block] [color:#6e7c91] [font-size:14px] [margin:5px_0_24px] [.auth-form>_&]:[margin-bottom:45px] [&_)]:[color:#328A66] max-[700px]:[.auth-form>_&]:[margin-bottom:35px] [line-height:1.5] [&_):hover]:[color:#267653]">
          ← All companies
        </Link>
        {loading ? (
          <p role="status" className="text-sm leading-6 text-[#71817A]">Loading company profile…</p>
        ) : error ? (
          <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]" role="alert">
            {error}
          </div>
        ) : !company ? (
          <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">
            <Building2 />
            <h3 className="text-lg font-semibold text-[#172B25]">Company profile not found</h3>
            <p className="text-sm leading-6 text-[#71817A]">This employer profile may have been removed.</p>
            <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]" href="/companies">
              Browse companies
            </Link>
          </div>
        ) : (
          <>
            <div className="company-profile-hero [display:flex] [align-items:center] [gap:16px] [padding:22px_0_28px] [border-bottom:1px_solid_#edf0f3] [&>div]:[flex:1] [&_h1]:[font-size:clamp(1.75rem,_3vw,_2.25rem)] [&_h1]:[margin:5px_0] [&_h1]:[color:#273d5e] [&_p]:[font-size:14px] [&_p]:[color:#8490a0] [&_p]:[margin:0] max-[700px]:[flex-wrap:wrap] max-[700px]:[&>div]:[min-width:calc(100%_-_80px)] [&_h1]:[line-height:1.2] [&_p]:[line-height:1.5]">
              <span className="company-logo [display:grid] [place-items:center] [width:42px] [height:42px] [border-radius:11px] [color:#fff] [font-weight:700] [font-size:17px] max-[700px]:[.result-card>_&]:[width:36px] max-[700px]:[.result-card>_&]:[height:36px] [.home-featured_&]:[overflow:hidden] [.home-featured_&]:[width:52px] [.home-featured_&]:[height:52px] [.home-featured_&]:[border:1px_solid_#edf0f5] [.home-featured_&]:[border-radius:14px] [.home-featured_&]:[font-size:18px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_img]:[padding:4px] [&_img]:[background:#fff] [background:#3FA47B] big [width:58px] [height:58px] [font-size:23px]">
                {company.logo ? (
                  <img src={company.logo} alt="" />
                ) : (
                  company.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <div>
                <div className="verified-label [display:flex] [align-items:center] [gap:5px] [color:#328A66] [font-size:14px] [letter-spacing:.7px] [font-weight:600] [line-height:1.45]">EMPLOYER PROFILE</div>
                <h1 className="text-3xl font-semibold tracking-tight text-[#172B25] sm:text-4xl">{company.name}</h1>
                <p className="text-sm leading-6 text-[#71817A]">
                  {[company.industry, company.location]
                    .filter(Boolean)
                    .join(" · ") || "Employer details not provided"}
                </p>
              </div>
            </div>
            <div className="company-profile-columns [display:grid] [grid-template-columns:1fr_290px] [gap:18px] [margin:20px_0] max-[700px]:[grid-template-columns:1fr]">
              <section className="panel [background:#fff] [border:1px_solid_#eaedf1] [border-radius:.75rem] [border-color:#E5ECE8] [box-shadow:0_1px_2px_rgb(24_45_77_/_3%)] company-about [padding:20px] [&_h2]:[font-size:1.25rem] [&_h2]:[color:#344962] [&_h2]:[margin:0_0_9px] [&_h3]:[font-size:var(--type-subheading)] [&_h3]:[color:#344962] [&_p]:[font-size:16px] [&_p]:[line-height:1.65] [&_p]:[color:#7f8c9c] [&_h2]:[line-height:1.3] [&_h3]:[line-height:1.4] [background-color:#fff] [border-color:#E5ECE8] [background:#fff]">
                <h2 className="text-2xl font-semibold tracking-tight text-[#172B25]">About {company.name}</h2>
                <p className="text-sm leading-6 text-[#71817A]">
                  {company.description ||
                    "This employer has not added a company description yet."}
                </p>
              </section>
              <aside className="summary-card [border:1px_solid_#e9edf2] [border-radius:.75rem] [padding:18px] [&>b]:[font-size:21px] [&>div]:[display:flex] [&>div]:[gap:11px] [&>div]:[align-items:center] [&>div]:[padding:15px_0] [&>div]:[border-bottom:1px_solid_#eff1f4] [&>div]:[color:#6780b8] [&>div_svg]:[width:17px] [&>div_span]:[display:grid] [&>div_span]:[gap:4px] [&>div_span]:[font-size:14px] [&>div_span]:[color:#42536d] [&>div_small]:[font-size:14px] [&>div_small]:[color:#8d98a7] max-[700px]:[display:grid] max-[700px]:[grid-template-columns:1fr_1fr] max-[700px]:[gap:0_10px] max-[700px]:[&>b]:[grid-column:1/-1] max-[700px]:[&>div]:[border:0] [&>b]:[line-height:1.35] [&>div_span]:[line-height:1.5] [&>div_small]:[line-height:1.5] [border-color:#E5ECE8] [background-color:#fff] [&>_div]:[color:#328A66] [background:#fff]">
                <b>Company details</b>
                {company.companySize && (
                  <div>
                    <Users />
                    <span>
                      <small>Company size</small>
                      {company.companySize}
                    </span>
                  </div>
                )}
                {company.industry && (
                  <div>
                    <Building2 />
                    <span>
                      <small>Industry</small>
                      {company.industry}
                    </span>
                  </div>
                )}
                {company.location && (
                  <div>
                    <MapPin />
                    <span>
                      <small>Location</small>
                      {company.location}
                    </span>
                  </div>
                )}
                {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[#328A66] hover:text-[#267653]">Visit company website</a>}
                {Object.entries(company.socialLinks || {}).filter(([, url]) => Boolean(url)).map(([network, url]) => <a key={network} href={url as string} target="_blank" rel="noreferrer" className="mt-2 block text-sm capitalize text-[#328A66] hover:text-[#267653]">{network}</a>)}
              </aside>
            </div>
            <section className="company-openings [margin-top:45px]">
              <div className="section-heading [display:flex] [align-items:flex-end] [justify-content:space-between] [margin-bottom:31px] [&_p]:[color:#8490a1] [&_p]:[margin:10px_0_0] [&_p]:[font-size:16px] max-[700px]:[align-items:flex-start] max-[700px]:[gap:1rem] max-[700px]:[&_p]:[max-width:280px] max-[700px]:[&_p]:[line-height:1.5] [&_h2]:[font-size:clamp(28px,_3vw,_38px)] [&_h2]:[margin:0] [&_h2]:[color:#29405f] [&>span]:[color:#8792a0] [&>span]:[font-size:14px] [&_h2]:[line-height:1.25] [&_h2]:[letter-spacing:-0.025em] [&_p]:[line-height:1.65] [&>span]:[line-height:1.5] max-[700px]:[&_h2]:[font-size:1.7rem] max-[420px]:[flex-direction:column]">
                <div>
                  <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">OPEN OPPORTUNITIES</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#172B25]">Current openings</h2>
                </div>
                <span>
                  {company.jobCount} active{" "}
                  {company.jobCount === 1 ? "job" : "jobs"}
                </span>
              </div>
              {jobsLoading ? (
                <p role="status" className="text-sm leading-6 text-[#71817A]">Loading jobs…</p>
              ) : openings.length ? (
                <div className="feature-grid [display:grid] [grid-template-columns:repeat(3,1fr)] [gap:15px] max-[700px]:[grid-template-columns:1fr] [align-items:stretch] [.home-featured_&]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [.home-featured_&]:[gap:19px] [.home-featured_&]:[align-items:stretch] max-[820px]:[.home-featured_&]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[600px]:[.home-featured_&]:[grid-template-columns:1fr]">
                  {openings.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">
                  <p className="text-sm leading-6 text-[#71817A]">
                    {company.jobCount
                      ? "View the job directory for current openings."
                      : "This company has no active approved jobs at the moment."}
                  </p>
                  <Link href="/jobs" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]">
                    Browse jobs
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      
    </>
  );
}
