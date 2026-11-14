"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, BriefcaseBusiness, Building2, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { CountUp } from "@/components/animations/CountUp";

type Summary = Record<string, number | string>;

export function DashboardOverview({ roleKey }: { roleKey: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message || "Could not load dashboard data."); if (active) setSummary(result.summary); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load dashboard data."); });
    return () => { active = false; };
  }, []);
  const admin = roleKey === "admin";
  const employer = roleKey === "employer";
  const items = admin
    ? [["Active members", "members", Users], ["Job seekers", "seekers", Users], ["Employers", "employers", Building2], ["Active jobs", "activeJobs", BriefcaseBusiness], ["Pending approval", "pendingJobs", ClipboardList], ["Applications", "applications", Activity]] as const
    : employer
      ? [["Your jobs", "jobs", BriefcaseBusiness], ["Active jobs", "activeJobs", BriefcaseBusiness], ["Pending approval", "pendingJobs", ClipboardList], ["Applications", "applications", Users]] as const
      : [["Applications", "applications", ClipboardList], ["Saved jobs", "saved", BriefcaseBusiness], ["Active opportunities", "activeJobs", Activity]] as const;
  return <section aria-live="polite">{!summary && !error ? <p role="status">Loading account statistics…</p> : error ? <div className="empty-state" role="alert">{error}</div> : <><div className="metric-grid">{items.map(([label,key,Icon])=><article className="metric-card" key={key}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17}/></span></div><CountUp value={String(summary?.[key] ?? 0)}/></article>)}</div><div className="panel table-panel dashboard-summary-note"><div className="panel-head"><div><b>{admin ? "Platform overview" : employer ? "Hiring overview" : "Your job search"}</b><small>{admin ? "Current records from the JobZ database" : employer ? "Current records for your employer account" : "Your activity and current opportunities"}</small></div></div><p>{admin ? "Use the workspace menu to review jobs, employers, and platform records." : employer ? "Manage your job posts and review applications from your workspace." : "Browse active approved roles and track your applications from here."}</p><Link className="text-link" href={admin ? "/admin/jobs" : employer ? "/employer/manage-jobs" : "/jobs"}>{admin ? "Review jobs" : employer ? "Manage jobs" : "Browse jobs"} <ArrowRight size={14}/></Link></div></>}</section>;
}
