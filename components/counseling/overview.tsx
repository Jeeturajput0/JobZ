"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardList, Handshake, Plus, UserCheck, Users } from "lucide-react";
import { EmptyState, ErrorBox, PageHeader, Panel, StatCard, StatusBadge } from "@/components/super-admin/ui";

type Row = Record<string, unknown>;

export function CounselingOverview() {
  const [payload, setPayload] = useState<{ stats: Record<string, number>; widgets: Record<string, unknown>; recent: Record<string, Row[]> } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/counseling/overview", { cache: "no-store" })
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
  if (!payload) return <><PageHeader title="Dashboard overview" subtitle="Loading counseling statistics…" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" />)}</div></>;

  const s = payload.stats;
  const w = payload.widgets as {
    recentCandidates?: Row[]; recentPartnerships?: Row[]; recentRequests?: Row[];
    recentRecommendations?: Row[]; recentInterviews?: Row[];
    awaitingFollowUp?: number; assignedToCounselors?: number;
    hiring?: Record<string, number>; placement?: Record<string, number>;
  };
  const activity = payload.recent.activity || [];

  const stats = [
    { label: "Total Candidates", value: s.totalCandidates },
    { label: "Active Candidates", value: s.activeCandidates },
    { label: "Candidates Under Counseling", value: s.candidatesUnderCounseling },
    { label: "Total Counselors", value: s.totalCounselors },
    { label: "Active Team Members", value: s.activeTeamMembers },
    { label: "Total Partnered Companies", value: s.totalPartneredCompanies },
    { label: "Pending Partnership Requests", value: s.pendingPartnershipRequests },
    { label: "Active Partnerships", value: s.activePartnerships },
    { label: "Total Hiring Requests", value: s.totalHiringRequests },
    { label: "Pending Hiring Requests", value: s.pendingHiringRequests },
    { label: "Candidates Recommended", value: s.candidatesRecommended },
    { label: "Applications Through Counseling", value: s.totalApplicationsThroughCounseling },
    { label: "Interviews Scheduled", value: s.interviewsScheduled },
    { label: "Candidates Selected", value: s.candidatesSelected },
    { label: "Confirmed Placements", value: s.confirmedPlacements },
  ];

  return (
    <>
      <PageHeader title="Dashboard overview" subtitle="Live statistics and recent activity from your counseling organization." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => <StatCard key={item.label} label={item.label} value={item.value ?? 0} />)}
      </div>

      <div className="mt-6">
        <Panel title="Quick actions" subtitle="All actions open real, connected forms and lists.">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Add Candidate", href: "/counseling/candidates/add", icon: Plus },
              { label: "Add Team Member", href: "/counseling/team/add", icon: Users },
              { label: "Find Companies", href: "/counseling/companies", icon: Building2 },
              { label: "Send Partnership Request", href: "/counseling/partnerships/send", icon: Handshake },
              { label: "View Hiring Requests", href: "/counseling/hiring-requests", icon: ClipboardList },
              { label: "Recommend Candidate", href: "/counseling/recommendations/new", icon: UserCheck },
            ].map((a) => {
              const Icon = a.icon;
              return <Link key={a.href} href={a.href} className="inline-flex items-center gap-2 rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-[13px] font-medium text-[#34455D] hover:border-[#3FA47B] hover:text-[#267653]"><Icon size={15} /> {a.label}</Link>;
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel title="Candidate overview">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Total candidates" value={s.totalCandidates} />
            <MiniStat label="Active candidates" value={s.activeCandidates} />
            <MiniStat label="Awaiting follow-up" value={w.awaitingFollowUp || 0} />
            <MiniStat label="Assigned to counselors" value={w.assignedToCounselors || 0} />
          </div>
          <p className="mt-4 text-xs font-semibold text-[#52627A]">Recently added</p>
          {w.recentCandidates?.length ? <MiniList rows={w.recentCandidates} primary={(r) => String(r.name || "Candidate")} secondary={(r) => date(r.createdAt)} badge={(r) => <StatusBadge value={r.workflowStatus} />} /> : <EmptyState message="No candidates added yet." />}
        </Panel>

        <Panel title="Partnership overview">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Partnered companies" value={s.totalPartneredCompanies} />
            <MiniStat label="Pending requests" value={s.pendingPartnershipRequests} />
            <MiniStat label="Active partnerships" value={s.activePartnerships} />
          </div>
          <p className="mt-4 text-xs font-semibold text-[#52627A]">Recently added</p>
          {w.recentPartnerships?.length ? <MiniList rows={w.recentPartnerships} primary={(r) => String(r.company || "Company")} secondary={(r) => date(r.createdAt)} badge={(r) => <StatusBadge value={r.status} />} /> : <EmptyState message="No partnership requests yet." />}
        </Panel>

        <Panel title="Hiring overview">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Total requests" value={s.totalHiringRequests} />
            <MiniStat label="Open requests" value={w.hiring?.open || 0} />
            <MiniStat label="Candidates required" value={w.hiring?.candidatesRequired || 0} />
            <MiniStat label="Requests fulfilled" value={w.hiring?.fulfilled || 0} />
          </div>
          <p className="mt-4 text-xs font-semibold text-[#52627A]">Recent requests</p>
          {w.recentRequests?.length ? <MiniList rows={w.recentRequests} primary={(r) => String(r.jobTitle || "Request")} secondary={(r) => date(r.createdAt)} badge={(r) => <StatusBadge value={r.status} />} /> : <EmptyState message="No hiring requests received." />}
        </Panel>

        <Panel title="Candidate placement overview">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="Recommended" value={w.placement?.recommended || 0} />
            <MiniStat label="Interviewed" value={w.placement?.interviewed || 0} />
            <MiniStat label="Selected" value={w.placement?.selected || 0} />
            <MiniStat label="Confirmed joined" value={w.placement?.joined || 0} />
          </div>
          <p className="mt-4 text-xs font-semibold text-[#52627A]">Recent interviews</p>
          {w.recentInterviews?.length ? <MiniList rows={w.recentInterviews} primary={(r) => String(r.candidate || "Candidate")} secondary={(r) => `${String(r.job || "Job")} · ${date(r.scheduledAt)}`} badge={(r) => <StatusBadge value={r.status} />} /> : <EmptyState message="No interviews tracked yet." />}
        </Panel>

        <Panel title="Recent activity" action={<Link className="text-xs text-[#267653]" href="/counseling/team?tab=activity">View team activity</Link>}>
          {activity.length ? <MiniList rows={activity} primary={(r) => String(r.description || r.action || "Activity")} secondary={(r) => `${String(r.actorRole || "system")} · ${date(r.createdAt)}`} badge={(r) => <StatusBadge value={r.action} />} /> : <EmptyState message="No activity recorded yet." />}
        </Panel>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-[#E9EFEC] bg-[#FBFDFC] px-3 py-2"><p className="text-xl font-semibold text-[#267653]">{value ?? 0}</p><p className="text-[11px] text-[#71817A]">{label}</p></div>;
}

function date(v: unknown) { return v ? new Date(String(v)).toLocaleDateString() : "—"; }

function MiniList({ rows, primary, secondary, badge }: {
  rows: Row[]; primary: (r: Row) => string; secondary: (r: Row) => string; badge?: (r: Row) => React.ReactNode;
}) {
  return <div className="divide-y divide-[#F1F4F2]">
    {rows.map((row, i) => <div key={i} className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0"><p className="truncate text-[13px] font-medium text-[#34455D]">{primary(row)}</p><p className="truncate text-[11px] text-[#8A98A5]">{secondary(row)}</p></div>
      <span className="shrink-0">{badge?.(row)}</span>
    </div>)}
  </div>;
}
