"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorBox, PageHeader, Panel, StatCard, StatusBadge } from "./ui";

type Row = Record<string, unknown>;

export function OverviewSection() {
  const [payload, setPayload] = useState<{ stats: Record<string, number>; recent: Record<string, Row[]> } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/platform/overview", { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!active) return;
        if (!ok) throw new Error(d.message || "Unable to load overview.");
        setPayload(d);
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load overview."); });
    return () => { active = false; };
  }, []);

  if (error) return <><PageHeader title="Dashboard overview" /><ErrorBox message={error} /></>;
  if (!payload) return <><PageHeader title="Dashboard overview" subtitle="Loading platform statistics…" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" />)}</div></>;

  const s = payload.stats;
  const r = payload.recent;

  const stats = [
    { label: "Total Companies", value: s.totalCompanies },
    { label: "Verified Companies", value: s.verifiedCompanies },
    { label: "Pending Company Verification", value: s.pendingCompanyVerification },
    { label: "Rejected Companies", value: s.rejectedCompanies },
    { label: "Counseling Organizations", value: s.totalCounselingOrgs },
    { label: "Active Organizations", value: s.activeCounselingOrgs },
    { label: "Total Job Seekers", value: s.totalJobSeekers },
    { label: "Total Jobs", value: s.totalJobs },
    { label: "Active Jobs", value: s.activeJobs },
    { label: "Pending Jobs", value: s.pendingJobs },
    { label: "Total Applications", value: s.totalApplications },
    { label: "Total Partnerships", value: s.totalPartnerships },
    { label: "Active Partnerships", value: s.activePartnerships },
    { label: "Placement Records", value: s.totalPlacements },
  ];

  return (
    <>
      <PageHeader title="Dashboard overview" subtitle="Real-time platform statistics and recent activity." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => <StatCard key={item.label} label={item.label} value={item.value ?? 0} />)}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel title="Recent companies" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/companies">View all</Link>}>
          {r.companies?.length ? <SimpleList rows={r.companies} primary={(x) => String(x.name || "—")} secondary={(x) => `${(x.ownerId as Row)?.fullName || ""} · ${(x.employerProfileId as Row)?.companyName || ""}`} badge={(x) => <StatusBadge value={x.verificationStatus} />} /> : <EmptyState message="No companies have registered yet." />}
        </Panel>
        <Panel title="Recent job seekers" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/seekers">View all</Link>}>
          {r.seekers?.length ? <SimpleList rows={r.seekers} primary={(x) => String(x.fullName || "—")} secondary={(x) => String(x.email || "")} badge={(x) => new Date(String(x.createdAt)).toLocaleDateString()} /> : <EmptyState message="No job seekers have registered yet." />}
        </Panel>
        <Panel title="Recent jobs" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/jobs">View all</Link>}>
          {r.jobs?.length ? <SimpleList rows={r.jobs} primary={(x) => String(x.title || "—")} secondary={(x) => `${(x.companyId as Row)?.companyName || (x.employerId as Row)?.fullName || ""} · ${String(x.location || "")}`} badge={(x) => <StatusBadge value={x.approvalStatus} />} /> : <EmptyState message="No jobs have been posted yet." />}
        </Panel>
        <Panel title="Recent applications" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/applications">View all</Link>}>
          {r.applications?.length ? <SimpleList rows={r.applications} primary={(x) => String((x.jobId as Row)?.title || "—")} secondary={(x) => String((x.jobSeekerId as Row)?.fullName || "")} badge={(x) => <StatusBadge value={x.status} />} /> : <EmptyState message="No applications yet." />}
        </Panel>
        <Panel title="Pending company verifications" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/companies/verification">Review queue</Link>}>
          {r.pendingVerifications?.length ? <SimpleList rows={r.pendingVerifications} primary={(x) => String(x.name || "—")} secondary={(x) => String((x.ownerId as Row)?.email || "")} badge={() => <StatusBadge value="pending" />} /> : <EmptyState message="No companies awaiting verification." />}
        </Panel>
        <Panel title="Pending job approvals" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/jobs/pending">Review queue</Link>}>
          {r.pendingApprovals?.length ? <SimpleList rows={r.pendingApprovals} primary={(x) => String(x.title || "—")} secondary={(x) => String((x.companyId as Row)?.companyName || "")} badge={() => <StatusBadge value="pending" />} /> : <EmptyState message="No jobs awaiting approval." />}
        </Panel>
        <Panel title="Recent partnerships" action={<Link className="text-xs font-medium text-[#267653]" href="/admin/partnerships">View all</Link>}>
          {r.partnerships?.length ? <SimpleList rows={r.partnerships} primary={(x) => String((x.companyId as Row)?.name || "—")} secondary={(x) => String((x.counselingTeamId as Row)?.name || "")} badge={(x) => <StatusBadge value={x.status} />} /> : <EmptyState message="No partnerships recorded yet." />}
        </Panel>
        <Panel title="Recent platform activity">
          {r.activity?.length ? <SimpleList rows={r.activity} primary={(x) => String(x.description || x.action || "—")} secondary={(x) => `${String(x.actorRole || "system")} · ${new Date(String(x.createdAt)).toLocaleString()}`} badge={(x) => <StatusBadge value={x.action} />} /> : <EmptyState message="No activity recorded yet." />}
        </Panel>
      </div>
    </>
  );
}

function SimpleList({ rows, primary, secondary, badge }: {
  rows: Row[];
  primary: (row: Row) => string;
  secondary: (row: Row) => string;
  badge?: (row: Row) => React.ReactNode;
}) {
  return (
    <div className="divide-y divide-[#F1F4F2]">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-[#34455D]">{primary(row)}</p>
            <p className="truncate text-[11px] text-[#8A98A5]">{secondary(row)}</p>
          </div>
          <span className="shrink-0 text-[11px] text-[#71817A]">{badge?.(row)}</span>
        </div>
      ))}
    </div>
  );
}
