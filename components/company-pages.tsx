"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Users } from "lucide-react";
import { Footer, Navbar, JobCard } from "@/components/site";
import { useJobZ } from "@/components/provider";
import type { Job } from "@/data/jobs";

type Company = { id: string; name: string; logo: string; industry: string; location: string; companySize: string; description: string; jobCount: number };

function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/companies", { cache: "no-store" })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message || "Could not load companies."); if (active) setCompanies(result.companies || []); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load companies."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { companies, loading, error };
}

export function CompaniesDirectory() {
  const [query, setQuery] = useState("");
  const { companies, loading, error } = useCompanies();
  const filtered = companies.filter((company) => `${company.name} ${company.industry} ${company.location}`.toLowerCase().includes(query.toLowerCase()));
  return <><Navbar/><main className="jobs-page"><div className="jobs-head"><div><div className="kicker">EMPLOYER DIRECTORY</div><h1>Meet your <span className="serif-accent">future team.</span></h1><p>Explore company profiles and their active opportunities.</p></div></div><div className="searchbar jobs-search"><div className="search-field"><Building2/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search companies, industries, or locations"/></div></div>{loading ? <p role="status">Loading companies…</p> : error ? <div className="empty-state" role="alert">{error}</div> : filtered.length ? <div className="company-grid">{filtered.map((company)=><article className="company-card" key={company.id}><div className="company-cover"/><div className="company-card-logo" style={{background:"#eff2fb",color:"#4f67bd"}}>{company.logo ? <img src={company.logo} alt=""/> : company.name.slice(0,1).toUpperCase()}</div><div className="company-card-content"><h3>{company.name}</h3><p>{company.industry || "Industry not provided"}{company.location ? ` · ${company.location}` : ""}</p>{company.companySize && <div className="company-size"><Users size={14}/>{company.companySize}</div>}<div className="company-card-bottom"><span>{company.jobCount} active {company.jobCount===1?"job":"jobs"}</span><Link href={`/companies/${company.id}`} className="text-link">View company <ArrowRight size={14}/></Link></div></div></article>)}</div> : <div className="empty-state"><Building2/><h3>{query ? "No companies match your search" : "No company profiles yet"}</h3><p>{query ? "Try another company name, industry, or location." : "Company profiles will appear here when employers add them."}</p></div>}</main><Footer/></>;
}

export function CompanyDetails({ id }: { id: string }) {
  const { companies, loading, error } = useCompanies();
  const { jobs, jobsLoading } = useJobZ();
  const company = companies.find((item) => item.id === id);
  const openings = useMemo<Job[]>(() => company ? jobs.filter((job) => job.company.toLowerCase() === company.name.toLowerCase()) : [], [company, jobs]);
  return <><Navbar/><main className="jobs-page"><Link href="/companies" className="back-link">← All companies</Link>{loading ? <p role="status">Loading company profile…</p> : error ? <div className="empty-state" role="alert">{error}</div> : !company ? <div className="empty-state"><Building2/><h3>Company profile not found</h3><p>This employer profile may have been removed.</p><Link className="btn btn-outline" href="/companies">Browse companies</Link></div> : <><div className="company-profile-hero"><span className="company-logo big">{company.logo ? <img src={company.logo} alt=""/> : company.name.slice(0,1).toUpperCase()}</span><div><div className="verified-label">EMPLOYER PROFILE</div><h1>{company.name}</h1><p>{[company.industry,company.location].filter(Boolean).join(" · ") || "Employer details not provided"}</p></div></div><div className="company-profile-columns"><section className="panel company-about"><h2>About {company.name}</h2><p>{company.description || "This employer has not added a company description yet."}</p></section><aside className="summary-card"><b>Company details</b>{company.companySize && <div><Users/><span><small>Company size</small>{company.companySize}</span></div>}{company.industry && <div><Building2/><span><small>Industry</small>{company.industry}</span></div>}{company.location && <div><MapPin/><span><small>Location</small>{company.location}</span></div>}</aside></div><section className="company-openings"><div className="section-heading"><div><div className="kicker">OPEN OPPORTUNITIES</div><h2>Current openings</h2></div><span>{company.jobCount} active {company.jobCount===1?"job":"jobs"}</span></div>{jobsLoading ? <p role="status">Loading jobs…</p> : openings.length ? <div className="feature-grid">{openings.map((job)=><JobCard key={job.id} job={job}/>)}</div> : <div className="empty-state"><p>{company.jobCount ? "View the job directory for current openings." : "This company has no active approved jobs at the moment."}</p><Link href="/jobs" className="btn btn-outline">Browse jobs</Link></div>}</section></>}</main><Footer/></>;
}
