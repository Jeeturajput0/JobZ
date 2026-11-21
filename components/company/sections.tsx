"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { DataTable, EmptyState, ErrorBox, FilterBar, PageHeader, Pagination, Panel, StatCard, StatusBadge, type Column } from "@/components/super-admin/ui";

type Row = Record<string, unknown>;
const isId = (v?: string) => Boolean(v && /^[a-f\d]{24}$/i.test(v));
const date = (v: unknown) => v ? new Date(String(v)).toLocaleDateString() : "—";
const dateTime = (v: unknown) => v ? new Date(String(v)).toLocaleString() : "—";

export function CompanySection({ path }: { path: string[] }) {
  const [slug, sub] = path;
  if (!slug || slug === "dashboard") return <OverviewSection />;
  if (slug === "profile") return <ProfileSection />;
  if (slug === "team") return <TeamRouter sub={sub} />;
  if (slug === "jobs") return <JobsRouter sub={sub} />;
  if (slug === "applicants") return <ApplicantsRouter sub={sub} />;
  if (slug === "pipeline") return <PipelineSection />;
  if (slug === "interviews") return <InterviewsSection />;
  if (slug === "hiring-requests") return <HiringRequestsRouter sub={sub} />;
  if (slug === "partnerships") return <PartnershipsRouter sub={sub} />;
  if (slug === "recommendations") return <RecommendationsRouter sub={sub} />;
  if (slug === "placements") return <PlacementsRouter sub={sub} />;
  if (slug === "analytics") return <AnalyticsSection />;
  if (slug === "notifications") return <NotificationsSection />;
  if (slug === "settings") return <SettingsSection />;
  return <><PageHeader title="Not found" /><EmptyState message="Choose a section from the sidebar." /></>;
}

/* --------------------------------- helpers -------------------------------- */

type Field = { name: string; label: string; type?: "text" | "textarea" | "select" | "password" | "number" | "date"; options?: { value: string; label: string }[]; required?: boolean; placeholder?: string; defaultValue?: string; list?: boolean };

function FormCard({ title, subtitle, endpoint, method = "POST", fields, onDone, confirm, initial }: {
  title: string; subtitle?: string; endpoint: string; method?: "POST" | "PATCH" | "PUT"; fields: Field[];
  onDone?: (r: Record<string, unknown>) => void; confirm?: string; initial?: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, String(initial?.[f.name] ?? f.defaultValue ?? "")])));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true); setMessage(""); setIsError(false);
    try {
      const payload: Record<string, unknown> = { ...values };
      for (const f of fields) {
        if (f.list && typeof payload[f.name] === "string") {
          payload[f.name] = String(payload[f.name]).split(",").map((s) => s.trim()).filter(Boolean);
        }
        if (f.type === "number" && payload[f.name] !== "") payload[f.name] = Number(payload[f.name]);
      }
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { setIsError(true); setMessage(result.message || "Request failed."); return; }
      setMessage(result.message || "Saved successfully.");
      onDone?.(result);
    } catch { setIsError(true); setMessage("Could not connect to JobZ."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
    <h2 className="text-base font-semibold text-[#172B25]">{title}</h2>
    {subtitle && <p className="mt-0.5 text-xs text-[#8A98A5]">{subtitle}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {fields.map((f) => <label key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
        <span className="mb-1 block text-xs font-medium text-[#52627A]">{f.label}</span>
        {f.type === "textarea" ? (
          <textarea value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} rows={3} required={f.required} className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]" />
        ) : f.type === "select" ? (
          <select value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} required={f.required} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-[13px]">
            <option value="">Select…</option>
            {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input type={f.type || "text"} required={f.required} value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder} className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]" />
        )}
      </label>)}
    </div>
    <div className="mt-4 flex items-center gap-3">
      <button disabled={busy} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
      {message && <span className={`text-xs ${isError ? "text-[#B25238]" : "text-[#267653]"}`}>{message}</span>}
    </div>
  </form>;
}

function DetailPanel({ endpoint, children }: { endpoint: string; children: (data: Record<string, unknown>) => ReactNode }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (!active) return; if (!ok) throw new Error(d.message || "Unable to load details."); setData(d); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);
  if (error) return <ErrorBox message={error} />;
  if (loading || !data) return <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div>;
  return <>{children(data)}</>;
}

function usePaged<T>(endpoint: string, dataKey: string, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&limit=10`, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!active) return;
        if (!ok) throw new Error(d.message || "Unable to load data.");
        setData(Array.isArray(d[dataKey]) ? d[dataKey] : []);
        setTotal(Number(d.pagination?.total ?? d.total ?? 0));
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint, dataKey, page, ...deps]);
  return { data, total, loading, error, page, setPage };
}

type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };

function ListSection({ title, subtitle, endpoint, dataKey, columns, filters, action, refreshKey }: {
  title: string; subtitle?: string; endpoint: string; dataKey: string; columns: Column<Row>[];
  filters?: FilterDef[]; action?: ReactNode; refreshKey?: number;
}) {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const res = usePaged<Row>(`${endpoint}?search=${encodeURIComponent(search)}&${Object.entries(values).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`, dataKey, [search, values, refreshKey]);
  return <>
    <PageHeader title={title} subtitle={subtitle} action={action} />
    <Panel title={`${title} (${res.total})`}>
      <FilterBar search={search} onSearch={setSearch} filters={filters} values={values} onFilter={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
      {res.error && <ErrorBox message={res.error} />}
      {res.loading ? <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div> : res.data.length ? <DataTable columns={columns} rows={res.data} /> : <EmptyState message={`No ${title.toLowerCase()} found.`} />}
      <Pagination page={res.page} total={res.total} onChange={res.setPage} />
    </Panel>
  </>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-[11px] uppercase tracking-wide text-[#93A09A]">{label}</p><div className="mt-0.5 text-[13px] text-[#34455D]">{value}</div></div>;
}

/* -------------------------------- overview -------------------------------- */

function OverviewSection() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/company/overview", { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (!active) return; if (!ok) throw new Error(d.message || "Unable to load overview."); setData(d); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load overview."); });
    return () => { active = false; };
  }, []);
  if (error) return <><PageHeader title="Dashboard overview" /><ErrorBox message={error} /></>;
  if (!data) return <><PageHeader title="Dashboard overview" subtitle="Loading your hiring workspace…" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" />)}</div></>;
  const s = (data.stats || {}) as Record<string, number>;
  const recent = (data.recent || {}) as Record<string, Row[]>;
  const quick = [
    { label: "Create Job", href: "/company/jobs/new" },
    { label: "Manage Jobs", href: "/company/jobs" },
    { label: "View Applicants", href: "/company/applicants" },
    { label: "Schedule Interview", href: "/company/interviews" },
    { label: "Find Counseling Partners", href: "/company/partnerships" },
    { label: "Create Hiring Request", href: "/company/hiring-requests" },
    { label: "Manage Team", href: "/company/team" },
  ];
  return <>
    <div className="mb-6 rounded-xl border border-[#E5ECE8] bg-white p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3FA47B]">Hiring workspace</p>
      <h1 className="mt-1 text-2xl font-semibold text-[#172B25]">Welcome back 👋</h1>
      <p className="mt-1 text-sm text-[#71817A]">Real-time view of your recruitment activity.</p>
      <div className="mt-4 flex flex-wrap gap-2">{quick.map((q) => <Link key={q.href} href={q.href} className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#328A66]">{q.label}</Link>)}</div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Total Jobs", s.totalJobs], ["Active Jobs", s.activeJobs], ["Pending Approval", s.pendingApprovalJobs],
        ["Closed Jobs", s.closedJobs], ["Total Applicants", s.totalApplicants], ["New Applicants", s.newApplicants],
        ["Shortlisted", s.shortlistedCandidates], ["Interviews Scheduled", s.interviewsScheduled],
        ["Candidates Selected", s.candidatesSelected], ["Confirmed Hires", s.confirmedHires],
        ["Pending Hiring Requests", s.pendingHiringRequests], ["Active Partnerships", s.activePartnerships],
      ].map(([label, value]) => <StatCard key={String(label)} label={String(label)} value={Number(value) || 0} />)}
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Panel title="Company profile completion" action={<Link href="/company/profile" className="text-xs text-[#267653]">Edit profile</Link>}>
        <div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9EFEC]"><div className="h-full rounded-full bg-[#3FA47B]" style={{ width: `${Number(data.profileCompletion) || 0}%` }} /></div><span className="text-xs font-semibold text-[#267653]">{Number(data.profileCompletion) || 0}%</span></div>
        <p className="mt-2 text-xs text-[#71817A]">Missing: {((data.missingProfileFields as string[]) || []).join(", ") || "Nothing"}</p>
      </Panel>
      <Panel title="Recruitment pipeline" action={<Link href="/company/pipeline" className="text-xs text-[#267653]">Open pipeline</Link>}>
        {(data.pipeline as Row[] || []).length ? <div className="flex flex-wrap gap-2">{(data.pipeline as Row[]).map((p) => <div key={String(p.status)} className="rounded-lg border border-[#E9EFEC] bg-[#FBFDFC] px-3 py-2"><p className="text-lg font-semibold text-[#267653]">{String(p.count)}</p><p className="text-[10px] text-[#71817A]">{String(p.status).replace(/([A-Z])/g, " ")}</p></div>)}</div> : <EmptyState message="No applications in the pipeline yet." />}
      </Panel>
      <Panel title="Recent job postings" action={<Link href="/company/jobs" className="text-xs text-[#267653]">All jobs</Link>}>
        {(recent.jobs || []).length ? <div className="divide-y divide-[#F1F4F2]">{recent.jobs.map((j) => <div key={String(j.id)} className="flex items-center justify-between py-2.5"><Link href={`/company/jobs/${String(j.id)}`} className="text-[13px] font-medium text-[#267653]">{String(j.title)}</Link><span className="text-xs text-[#71817A]">{String(j.applications || 0)} applicants · <StatusBadge value={j.approvalStatus} /></span></div>)}</div> : <EmptyState message="No jobs posted yet." />}
      </Panel>
      <Panel title="Recent applications" action={<Link href="/company/applicants" className="text-xs text-[#267653]">View all</Link>}>
        {(recent.applications || []).length ? <div className="divide-y divide-[#F1F4F2]">{recent.applications.map((a) => <div key={String(a.id)} className="flex items-center justify-between py-2.5"><div><p className="text-[13px] font-medium text-[#34455D]">{String(a.candidate)}</p><p className="text-[11px] text-[#8A98A5]">{String(a.job)} · {date(a.appliedAt)}</p></div><StatusBadge value={a.status} /></div>)}</div> : <EmptyState message="No applications yet." />}
      </Panel>
      <Panel title="Upcoming interviews">
        {(recent.interviews || []).length ? <div className="divide-y divide-[#F1F4F2]">{recent.interviews.map((i) => <div key={String(i.id)} className="py-2.5"><p className="text-[13px] font-medium text-[#34455D]">{String(i.candidate)} · {String(i.job)}</p><p className="text-[11px] text-[#8A98A5]">{dateTime(i.scheduledAt)} · {String(i.mode)}</p></div>)}</div> : <EmptyState message="No upcoming interviews." />}
      </Panel>
      <Panel title="Partner counseling organizations" action={<Link href="/company/partnerships" className="text-xs text-[#267653]">Manage</Link>}>
        {(data.partners as Row[] || []).length ? <div className="divide-y divide-[#F1F4F2]">{(data.partners as Row[]).map((p) => <div key={String(p.id)} className="flex items-center justify-between py-2.5"><span className="text-[13px] text-[#34455D]">{String(p.name)}</span><StatusBadge value={p.status} /></div>)}</div> : <EmptyState message="No counseling partnerships yet." />}
      </Panel>
      <Panel title="Recent candidate recommendations">
        {(recent.recommendations || []).length ? <div className="divide-y divide-[#F1F4F2]">{recent.recommendations.map((r) => <div key={String(r.id)} className="flex items-center justify-between py-2.5"><span className="text-[13px] text-[#34455D]">{String(r.candidate)} · {String(r.job)}</span><StatusBadge value={r.status} /></div>)}</div> : <EmptyState message="No recommendations received yet." />}
      </Panel>
      <Panel title="Latest recruitment activity">
        {(recent.activity || []).length ? <div className="divide-y divide-[#F1F4F2]">{(recent.activity || []).slice(0, 6).map((a, i) => <div key={i} className="py-2.5"><p className="text-[13px] text-[#34455D]">{String(a.description || a.action)}</p><p className="text-[11px] text-[#8A98A5]">{dateTime(a.createdAt)}</p></div>)}</div> : <EmptyState message="No activity recorded yet." />}
      </Panel>
    </div>
  </>;
}

/* --------------------------------- profile --------------------------------- */

function ProfileSection() {
  const [data, setData] = useState<{ company: Row; profile: Row; completion: number } | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/company", { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d)).catch(() => undefined); }, []);
  if (!data) return <><PageHeader title="Company profile" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const c = data.company || {};
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return <>
    <PageHeader title="Company profile" subtitle="Keep your company information accurate and complete." />
    {message && <div className="mb-4 rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#267653]">{message}</div>}
    <Panel title="Profile completion"><div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9EFEC]"><div className="h-full rounded-full bg-[#3FA47B]" style={{ width: `${Number(data.completion) || 0}%` }} /></div><span className="text-xs font-semibold text-[#267653]">{Number(data.completion) || 0}%</span></div><p className="mt-2 text-xs text-[#71817A]">Verification: <StatusBadge value={c.verificationStatus} /></p></Panel>
    <div className="mt-5 space-y-5">
      <FormCard title="Company information" endpoint="/api/company" method="PATCH" initial={c} fields={[
        { name: "name", label: "Company name", required: true, defaultValue: s(c.name) },
        { name: "industry", label: "Industry", defaultValue: s(c.industry) },
        { name: "description", label: "Description", type: "textarea", defaultValue: s(c.description) },
        { name: "website", label: "Website", defaultValue: s(c.website) },
        { name: "email", label: "Company email", defaultValue: s(c.email) },
        { name: "phone", label: "Company phone", defaultValue: s(c.phone) },
        { name: "headquarters", label: "Headquarters", defaultValue: s(c.headquarters) },
        { name: "address", label: "Address", defaultValue: s(c.address) },
        { name: "city", label: "City", defaultValue: s(c.city) },
        { name: "state", label: "State", defaultValue: s(c.state) },
        { name: "country", label: "Country", defaultValue: s(c.country) },
        { name: "companySize", label: "Company size", defaultValue: s(c.companySize) },
        { name: "foundedYear", label: "Founded year", type: "number", defaultValue: String(c.foundedYear || "") },
        { name: "companyType", label: "Company type", defaultValue: s(c.companyType) },
        { name: "hiringInformation", label: "Hiring information", type: "textarea", defaultValue: s(c.hiringInformation) },
      ]} onDone={(r) => { setMessage(String(r.message || "Profile saved.")); setData((prev) => prev ? { ...prev, company: (r.company as Row) || prev.company } : prev); }} />
      <FormCard title="Branding & visibility" endpoint="/api/company" method="PATCH" initial={c} fields={[
        { name: "logo", label: "Logo (image URL or data URL)", defaultValue: s(c.logo) },
        { name: "coverImage", label: "Cover image (image URL or data URL)", defaultValue: s(c.coverImage) },
        { name: "profilePublic", label: "Public profile", type: "select", defaultValue: c.profilePublic ? "true" : "false", options: [{ value: "true", label: "Visible" }, { value: "false", label: "Private" }] },
      ]} onDone={(r) => setMessage(String(r.message || "Saved."))} />
    </div>
  </>;
}

/* ---------------------------------- team ----------------------------------- */

function TeamRouter({ sub }: { sub?: string }) {
  if (sub === "add") return <AddMember />;
  return <>
    <ListSection title="Team members" subtitle="HR managers and recruiters in your company." endpoint="/api/company/team" dataKey="members" columns={[
      { key: "name", label: "Member", render: (r) => String((r.userId as Row)?.fullName || "—") },
      { key: "email", label: "Email", render: (r) => String((r.userId as Row)?.email || "—") },
      { key: "title", label: "Role" },
      { key: "jobs", label: "Assigned jobs", render: (r) => `${(r.assignedJobs as Row[] || []).length}` },
      { key: "candidates", label: "Assigned candidates", render: (r) => `${(r.assignedCandidates as Row[] || []).length}` },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    ]} action={<Link href="/company/team/add" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Add member</Link>} />
  </>;
}

function AddMember() {
  const [roles, setRoles] = useState<Row[]>([]);
  useEffect(() => { fetch("/api/company/roles", { cache: "no-store" }).then((r) => r.json()).then((d) => setRoles(Array.isArray(d.roles) ? d.roles : [])).catch(() => undefined); }, []);
  return <>
    <PageHeader title="Add team member" action={<Link href="/company/team" className="text-xs text-[#267653]">← Back</Link>} />
    <FormCard title="Member details" endpoint="/api/company/team" fields={[
      { name: "fullName", label: "Full name", required: true },
      { name: "email", label: "Email", required: true },
      { name: "title", label: "Role title" },
      { name: "roleId", label: "Role", type: "select", options: roles.map((r) => ({ value: String(r._id), label: String(r.name) })) },
      { name: "permissions", label: "Permission keys (comma separated)" },
      { name: "password", label: "Temporary password" },
    ]} />
  </>;
}

/* ---------------------------------- jobs ----------------------------------- */

function JobsRouter({ sub }: { sub?: string }) {
  if (sub === "new") return <NewJob />;
  if (isId(sub)) return <JobDetail id={sub!} />;
  return <ListSection title="Jobs" subtitle="Manage your job postings and approvals." endpoint="/api/company/jobs" dataKey="jobs" columns={jobColumns} filters={[
    { key: "status", label: "Status", options: [{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "closed", label: "Closed" }] },
    { key: "approvalStatus", label: "Approval", options: [{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }] },
    { key: "category", label: "Category", options: [{ value: "IT", label: "IT" }, { value: "Sales", label: "Sales" }, { value: "Marketing", label: "Marketing" }] },
  ]} action={<Link href="/company/jobs/new" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Create job</Link>} />;
}

const jobColumns: Column<Row>[] = [
  { key: "title", label: "Job title", render: (r) => <Link className="font-medium text-[#267653]" href={`/company/jobs/${String(r._id)}`}>{String(r.title || "—")}</Link> },
  { key: "category", label: "Category" },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "approvalStatus", label: "Approval", render: (r) => <StatusBadge value={r.approvalStatus} /> },
  { key: "applications", label: "Applicants" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviews", label: "Interviews" },
  { key: "createdAt", label: "Posted", render: (r) => date(r.createdAt) },
];

function NewJob() {
  const [categories, setCategories] = useState<Row[]>([]);
  useEffect(() => { fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()).then((d) => setCategories(Array.isArray(d.categories) ? d.categories : [])).catch(() => undefined); }, []);
  return <>
    <PageHeader title="Create a job" subtitle="New jobs are submitted for platform approval before going live." action={<Link href="/company/jobs" className="text-xs text-[#267653]">← Back</Link>} />
    <FormCard title="Job details" endpoint="/api/jobs" fields={[
      { name: "title", label: "Job title", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: categories.map((c) => ({ value: String(c.name), label: String(c.name) })) },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "shortDescription", label: "Short description", required: true },
      { name: "responsibilities", label: "Responsibilities (comma separated)", list: true },
      { name: "requirements", label: "Requirements (comma separated)", list: true },
      { name: "skills", label: "Skills (comma separated)", list: true },
      { name: "jobType", label: "Employment type", type: "select", options: [{ value: "full-time", label: "Full-time" }, { value: "part-time", label: "Part-time" }, { value: "internship", label: "Internship" }, { value: "contract", label: "Contract" }] },
      { name: "workMode", label: "Work mode", type: "select", options: [{ value: "onsite", label: "On-site" }, { value: "remote", label: "Remote" }, { value: "hybrid", label: "Hybrid" }] },
      { name: "experienceLevel", label: "Experience level" },
      { name: "minSalary", label: "Min salary", type: "number" },
      { name: "maxSalary", label: "Max salary", type: "number" },
      { name: "location", label: "Location", required: true },
      { name: "applicationDeadline", label: "Application deadline", type: "date" },
      { name: "benefits", label: "Benefits (comma separated)", list: true },
    ]} />
  </>;
}

function JobDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Job details" action={<Link href="/company/jobs" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/company/jobs/${id}`}>
      {(d) => {
        const j = (d.job as Row) || {};
        return <div className="space-y-5">
          <Panel title="Job">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Title" value={String(j.title || "—")} />
              <Info label="Category" value={String(j.category || "—")} />
              <Info label="Location" value={String(j.location || "—")} />
              <Info label="Type" value={String(j.jobType || "—")} />
              <Info label="Work mode" value={String(j.workMode || "—")} />
              <Info label="Experience" value={String(j.experienceLevel || "—")} />
              <Info label="Status" value={<StatusBadge value={j.status} />} />
              <Info label="Approval" value={<StatusBadge value={j.approvalStatus} />} />
              <Info label="Deadline" value={j.applicationDeadline ? date(j.applicationDeadline) : "—"} />
            </div>
          </Panel>
          <Panel title="Manage job">
            <FormCard title="Status & approval" endpoint="/api/company/jobs" method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this job?" fields={[
              { name: "jobId", label: "Job ID", defaultValue: id },
              { name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "closed", label: "Closed" }] },
              { name: "approvalStatus", label: "Submit for approval", type: "select", options: [{ value: "pending", label: "Submit for approval" }] },
            ]} />
          </Panel>
          <Panel title="Description"><p className="whitespace-pre-wrap text-[13px] text-[#34455D]">{String(j.description || "—")}</p></Panel>
          <Panel title="Skills"><div className="flex flex-wrap gap-2">{(j.skills as string[] || []).map((s) => <span key={s} className="rounded bg-[#EAF5F0] px-2 py-1 text-xs text-[#267653]">{s}</span>)}</div></Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------- applicants -------------------------------- */

function ApplicantsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <ApplicantDetail id={sub!} />;
  return <ListSection title="Applicants" subtitle="Candidates who applied to your jobs." endpoint="/api/company/applications" dataKey="applications" columns={[
    { key: "candidate", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/company/applicants/${String(r._id)}`}>{String((r.jobSeekerId as Row)?.fullName || "—")}</Link> },
    { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
    { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source === "recommendation" ? "Counseling Referral" : "Direct Application"} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { key: "assignedTo", label: "Recruiter", render: (r) => String((r.assignedTo as Row)?.fullName || "Unassigned") },
    { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) },
  ]} filters={[
    { key: "status", label: "Status", options: ["applied", "underReview", "shortlisted", "interviewScheduled", "interviewCompleted", "selected", "rejected", "withdrawn"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) },
    { key: "source", label: "Source", options: [{ value: "direct", label: "Direct" }, { value: "recommendation", label: "Counseling referral" }] },
  ]} />;
}

function ApplicantDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Applicant details" action={<Link href="/company/applicants" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/company/applications/${id}`}>
      {(d) => {
        const a = (d.application as Row) || {};
        const c = (d.candidate as Row) || {};
        return <div className="space-y-5">
          <Panel title="Application">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Candidate" value={String(c.fullName || (a.jobSeekerId as Row)?.fullName || "—")} />
              <Info label="Email" value={String(c.email || "—")} />
              <Info label="Status" value={<StatusBadge value={a.status} />} />
              <Info label="Source" value={<StatusBadge value={a.source === "recommendation" ? "Counseling Referral" : "Direct Application"} />} />
              <Info label="Applied" value={date(a.appliedAt)} />
              <Info label="Cover letter" value={String(a.coverLetter || "—")} />
              <Info label="Resume" value={a.resumeUrl ? <a className="text-[#267653]" href={String(a.resumeUrl)} target="_blank" rel="noreferrer">View</a> : "—"} />
            </div>
          </Panel>
          <Panel title="Candidate profile">
            <p className="text-[13px] text-[#34455D]"><b>Skills:</b> {String((c.skills as string[] || []).join(", ") || "—")}</p>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Education</p>{(c.education as Row[] || []).length ? <DataTable columns={[{ key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }]} rows={c.education as Row[]} /> : <EmptyState message="Not shared / not available." />}</div>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Experience</p>{(c.experience as Row[] || []).length ? <DataTable columns={[{ key: "company", label: "Company" }, { key: "position", label: "Position" }]} rows={c.experience as Row[]} /> : <EmptyState message="Not shared / not available." />}</div>
          </Panel>
          <FormCard title="Update application" endpoint={`/api/company/applications/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this application?" fields={[
            { name: "status", label: "Status", type: "select", options: ["underReview", "shortlisted", "interviewScheduled", "interviewCompleted", "selected", "offerReceived", "hired", "rejected", "withdrawn"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) },
            { name: "assignedTo", label: "Assign recruiter (user ID)" },
            { name: "note", label: "Internal note", type: "textarea" },
          ]} />
          <Panel title="Interview history">{(d.interviews as Row[] || []).length ? <DataTable columns={[{ key: "scheduledAt", label: "Date", render: (r) => dateTime(r.scheduledAt) }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "mode", label: "Type" }]} rows={d.interviews as Row[]} /> : <EmptyState message="No interviews scheduled." />}</Panel>
          <Panel title="Recruitment timeline">{(a.timeline as Row[] || []).length ? <DataTable columns={[{ key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "note", label: "Note" }, { key: "at", label: "Date", render: (r) => dateTime(r.at) }]} rows={a.timeline as Row[]} /> : <EmptyState message="No timeline events." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* -------------------------------- pipeline --------------------------------- */

function PipelineSection() {
  const [data, setData] = useState<{ stages: Row[]; applications: Row[] } | null>(null);
  const [days, setDays] = useState("");
  useEffect(() => { fetch(`/api/company/pipeline?days=${days}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d)).catch(() => undefined); }, [days]);
  if (!data) return <><PageHeader title="Recruitment pipeline" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  return <>
    <PageHeader title="Recruitment pipeline" subtitle="Real applicants across every hiring stage." action={<select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs"><option value="">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>} />
    <div className="mb-5 flex flex-wrap gap-2">{(data.stages || []).map((stage) => <div key={String(stage.status)} className="rounded-xl border border-[#E5ECE8] bg-white px-4 py-3 shadow-sm"><p className="text-xl font-semibold text-[#267653]">{String(stage.count)}</p><p className="text-[11px] text-[#71817A]">{String(stage.status).replace(/([A-Z])/g, " ")}</p></div>)}</div>
    <Panel title="Candidates in pipeline">
      {(data.applications || []).length ? <DataTable columns={[
        { key: "candidate", label: "Candidate", render: (r) => String((r.jobSeekerId as Row)?.fullName || "—") },
        { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
        { key: "status", label: "Stage", render: (r) => <StatusBadge value={r.status} /> },
        { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source === "recommendation" ? "Referral" : "Direct"} /> },
        { key: "recruiter", label: "Recruiter", render: (r) => String((r.assignedTo as Row)?.fullName || "Unassigned") },
        { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) },
      ]} rows={data.applications} /> : <EmptyState message="No applications in this period." />}
    </Panel>
  </>;
}

/* -------------------------------- interviews -------------------------------- */

function InterviewsSection() {
  const [period, setPeriod] = useState("");
  const [refresh, setRefresh] = useState(0);
  const res = usePaged<Row>(`/api/company/interviews?period=${period}`, "interviews", [period, refresh]);
  const [members, setMembers] = useState<Row[]>([]);
  useEffect(() => { fetch("/api/company/team", { cache: "no-store" }).then((r) => r.json()).then((d) => setMembers(Array.isArray(d.members) ? d.members : [])).catch(() => undefined); }, []);
  return <>
    <PageHeader title="Interviews" subtitle="Schedule, reschedule and track interviews." action={<select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs"><option value="">All</option><option value="upcoming">Upcoming</option><option value="past">Past</option></select>} />
    <Panel title={`Interviews (${res.total})`}>
      <FormCard title="Schedule an interview" endpoint="/api/company/interviews" onDone={() => setRefresh((r) => r + 1)} fields={[
        { name: "applicationId", label: "Application ID", required: true },
        { name: "scheduledAt", label: "Date & time", type: "date", required: true },
        { name: "durationMinutes", label: "Duration (minutes)", type: "number", defaultValue: "45" },
        { name: "mode", label: "Type", type: "select", options: [{ value: "remote", label: "Remote" }, { value: "onsite", label: "On-site" }, { value: "phone", label: "Phone" }] },
        { name: "location", label: "Location" },
        { name: "meetingLink", label: "Meeting link" },
        { name: "notes", label: "Instructions", type: "textarea" },
      ]} />
      <div className="mt-5" />
      {res.error && <ErrorBox message={res.error} />}
      {res.loading ? <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div> : res.data.length ? <DataTable columns={[
        { key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") },
        { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
        { key: "scheduledAt", label: "When", render: (r) => dateTime(r.scheduledAt) },
        { key: "mode", label: "Type", render: (r) => <StatusBadge value={r.mode} /> },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { key: "interviewers", label: "Interviewers", render: (r) => String((r.interviewerIds as Row[] || []).map((i) => i.fullName).join(", ")) },
      ]} rows={res.data} /> : <EmptyState message="No interviews scheduled." />}
      <Pagination page={res.page} total={res.total} onChange={res.setPage} />
    </Panel>
    <div className="mt-5"><InterviewFollowUp onDone={() => setRefresh((r) => r + 1)} /></div>
  </>;
}

function InterviewFollowUp({ onDone }: { onDone: () => void }) {
  const [id, setId] = useState("");
  const [status, setStatus] = useState("completed");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("Update this interview?")) return;
    const response = await fetch(`/api/company/interviews/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Interview updated." : "Unable to update interview."));
    if (response.ok) onDone();
  }
  return <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
    <h2 className="text-base font-semibold text-[#172B25]">Update interview / add feedback</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Interview ID" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]">
        <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="rescheduled">Rescheduled</option>
      </select>
      <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback note" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
    </div>
    <div className="mt-3 flex items-center gap-3"><button className="rounded-lg bg-[#3FA47B] px-4 py-2 text-[13px] font-semibold text-white">Update</button>{message && <span className="text-xs text-[#267653]">{message}</span>}</div>
  </form>;
}

/* ------------------------------ hiring requests ---------------------------- */

function HiringRequestsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <HiringRequestDetail id={sub!} />;
  return <>
    <ListSection title="Hiring requests" subtitle="Requests sent to partner counseling organizations." endpoint="/api/company/hiring-requests" dataKey="requests" columns={[
      { key: "jobTitle", label: "Role", render: (r) => <Link className="font-medium text-[#267653]" href={`/company/hiring-requests/${String(r._id)}`}>{String(r.jobTitle || "—")}</Link> },
      { key: "numberOfOpenings", label: "Openings" },
      { key: "priority", label: "Priority", render: (r) => <StatusBadge value={r.priority} /> },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { key: "assignedTo", label: "Counselor", render: (r) => String((r.assignedTo as Row)?.fullName || "Unassigned") },
      { key: "createdAt", label: "Created", render: (r) => date(r.createdAt) },
    ]} filters={[{ key: "status", label: "Status", options: ["draft", "submitted", "underReview", "assigned", "sourcing", "candidatesRecommended", "interviewing", "completed", "cancelled"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) }]} />
  </>;
}

function HiringRequestDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Hiring request details" action={<Link href="/company/hiring-requests" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/company/hiring-requests/${id}`}>
      {(d) => {
        const h = (d.request as Row) || {};
        return <div className="space-y-5">
          <Panel title="Request"><div className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Info label="Role" value={String(h.jobTitle || "—")} />
            <Info label="Openings" value={String(h.numberOfOpenings || 0)} />
            <Info label="Location" value={String(h.jobLocation || "—")} />
            <Info label="Status" value={<StatusBadge value={h.status} />} />
            <Info label="Required skills" value={String((h.requiredSkills as string[] || []).join(", "))} />
            <Info label="Deadline" value={h.hiringDeadline ? date(h.hiringDeadline) : "—"} />
          </div></Panel>
          <FormCard title="Update request" endpoint={`/api/company/hiring-requests/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} fields={[
            { name: "status", label: "Status", type: "select", options: ["submitted", "underReview", "cancelled", "completed"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) },
            { name: "feedback", label: "Feedback", type: "textarea" },
          ]} />
          <Panel title="Recommended candidates">{(d.recommendations as Row[] || []).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No candidates recommended yet." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* -------------------------------- partnerships ----------------------------- */

function PartnershipsRouter({ sub }: { sub?: string }) {
  if (sub === "discover") return <DiscoverPartners />;
  if (isId(sub)) return <PartnershipDetail id={sub!} />;
  return <>
    <ListSection title="Counseling partnerships" subtitle="Manage your counseling organization relationships." endpoint="/api/company/partnerships" dataKey="partnerships" columns={[
      { key: "org", label: "Organization", render: (r) => <Link className="font-medium text-[#267653]" href={`/company/partnerships/${String(r._id)}`}>{String((r.counselingTeamId as Row)?.name || "—")}</Link> },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { key: "initiatedBy", label: "Initiated by" },
      { key: "createdAt", label: "Requested", render: (r) => date(r.createdAt) },
    ]} filters={[{ key: "status", label: "Status", options: [{ value: "pending", label: "Pending" }, { value: "accepted", label: "Active" }, { value: "rejected", label: "Rejected" }, { value: "terminated", label: "Terminated" }] }]} action={<Link href="/company/partnerships/discover" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Find organizations</Link>} />
  </>;
}

function DiscoverPartners() {
  const [orgs, setOrgs] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => { fetch(`/api/company/counseling-organizations?search=${encodeURIComponent(search)}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setOrgs(Array.isArray(d.organizations) ? d.organizations : [])).catch(() => undefined); }, [search]);
  return <>
    <PageHeader title="Discover counseling organizations" action={<Link href="/company/partnerships" className="text-xs text-[#267653]">← Back</Link>} />
    <Panel title="Organizations">
      <FilterBar search={search} onSearch={setSearch} />
      {orgs.length ? <DataTable columns={[
        { key: "name", label: "Organization" },
        { key: "description", label: "About" },
        { key: "teamMembers", label: "Team members" },
        { key: "status", label: "Partnership", render: (r) => <StatusBadge value={r.partnershipStatus} /> },
        { key: "action", label: "Action", render: (r) => String(r.partnershipStatus) === "none" ? <SendPartnerForm id={String(r._id)} /> : <span className="text-xs text-[#71817A]">Requested</span> },
      ]} rows={orgs} /> : <EmptyState message="No active counseling organizations found." />}
    </Panel>
  </>;
}

function SendPartnerForm({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  async function send() {
    const response = await fetch("/api/company/partnerships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ counselingTeamId: id, message: "Partnership request" }) });
    if (response.ok) setDone(true);
  }
  return <button disabled={done} onClick={send} className="rounded-lg bg-[#3FA47B] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{done ? "Sent" : "Send request"}</button>;
}

function PartnershipDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Partnership details" action={<Link href="/company/partnerships" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/company/partnerships/${id}`}>
      {() => <FormCard title="Partnership status" endpoint="/api/company/partnerships" method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this partnership?" fields={[
        { name: "partnershipId", label: "Partnership ID", defaultValue: id },
        { name: "status", label: "Status", type: "select", options: [{ value: "accepted", label: "Accept" }, { value: "rejected", label: "Reject" }, { value: "cancelled", label: "Cancel request" }, { value: "terminated", label: "Terminate" }] },
        { name: "note", label: "Note", type: "textarea" },
      ]} />}
    </DetailPanel>
  </>;
}

/* ------------------------------ recommendations ---------------------------- */

function RecommendationsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <RecommendationDetail id={sub!} />;
  return <ListSection title="Recommendations" subtitle="Candidates recommended by counseling partners." endpoint="/api/company/recommendations" dataKey="recommendations" columns={[
    { key: "candidate", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/company/recommendations/${String(r._id)}`}>{String((r.candidateId as Row)?.fullName || "—")}</Link> },
    { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
    { key: "hiringRequest", label: "Hiring request", render: (r) => String((r.hiringRequestId as Row)?.jobTitle || "—") },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { key: "consent", label: "Consent", render: (r) => <StatusBadge value={r.candidateConsent} /> },
    { key: "createdAt", label: "Date", render: (r) => date(r.createdAt) },
  ]} filters={[{ key: "status", label: "Status", options: ["sentToCompany", "companyReviewing", "shortlisted", "interviewScheduled", "selected", "rejected", "hired"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) }]} />;
}

function RecommendationDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Recommendation details" action={<Link href="/company/recommendations" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/company/recommendations/${id}`}>
      {(d) => {
        const rec = (d.recommendation as Row) || {};
        return <div className="space-y-5">
          <Panel title="Recommendation"><div className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Info label="Candidate" value={String((rec.candidateId as Row)?.fullName || "—")} />
            <Info label="Job" value={String((rec.jobId as Row)?.title || "—")} />
            <Info label="Status" value={<StatusBadge value={rec.status} />} />
            <Info label="Consent" value={<StatusBadge value={rec.candidateConsent} />} />
            <Info label="Note" value={String(rec.note || "—")} />
          </div></Panel>
          <FormCard title="Review recommendation" endpoint={`/api/company/recommendations/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this recommendation?" fields={[
            { name: "status", label: "Status", type: "select", options: ["companyReviewing", "shortlisted", "interviewScheduled", "selected", "rejected"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) },
            { name: "feedback", label: "Feedback", type: "textarea" },
          ]} />
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* -------------------------------- placements ------------------------------- */

function PlacementsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <PlacementDetail id={sub!} />;
  return <ListSection title="Placement records" subtitle="Confirmed joining records from your hiring." endpoint="/api/company/placements" dataKey="placements" columns={[
    { key: "candidate", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/company/placements/${String(r._id)}`}>{String((r.candidateId as Row)?.fullName || "—")}</Link> },
    { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
    { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source} /> },
    { key: "joiningDate", label: "Joining", render: (r) => r.joiningDate ? date(r.joiningDate) : "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ]} filters={[{ key: "status", label: "Status", options: [{ value: "recorded", label: "Recorded" }, { value: "confirmed", label: "Confirmed" }] }]} />;
}

function PlacementDetail({ id }: { id: string }) {
  return <>
    <PageHeader title="Placement details" action={<Link href="/company/placements" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel endpoint={`/api/company/placements/${id}`}>
      {(d) => {
        const p = (d.placement as Row) || {};
        return <Panel title="Placement record"><div className="grid gap-3 text-[13px] sm:grid-cols-2">
          <Info label="Candidate" value={String((p.candidateId as Row)?.fullName || "—")} />
          <Info label="Company" value={String((p.companyId as Row)?.name || "—")} />
          <Info label="Job" value={String((p.jobId as Row)?.title || "—")} />
          <Info label="Status" value={<StatusBadge value={p.status} />} />
          <Info label="Joining date" value={p.joiningDate ? date(p.joiningDate) : "—"} />
        </div></Panel>;
      }}
    </DetailPanel>
  </>;
}

/* --------------------------------- analytics -------------------------------- */

function AnalyticsSection() {
  const [days, setDays] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    fetch(`/api/company/analytics?days=${days}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d.analytics || null)).catch(() => undefined);
  }, [days]);
  return <>
    <PageHeader title="Recruitment analytics" subtitle="Real metrics from your hiring data." action={<select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs"><option value="">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>} />
    {!data ? <div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /> : <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(data).filter(([, v]) => typeof v === "number").map(([k, v]) => <StatCard key={k} label={k.replace(/([A-Z])/g, " ")} value={Number(v)} />)}</div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Applications by status">{(data.applicationsByStatus as Row[] || []).length ? <DataTable columns={[{ key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "count", label: "Count" }]} rows={data.applicationsByStatus as Row[]} /> : <EmptyState message="No application data yet." />}</Panel>
        <Panel title="Job performance">{(data.jobsByPerformance as Row[] || []).length ? <DataTable columns={[{ key: "title", label: "Job" }, { key: "applications", label: "Applications" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={data.jobsByPerformance as Row[]} /> : <EmptyState message="No jobs posted yet." />}</Panel>
      </div>
    </>}
  </>;
}

/* ------------------------------- notifications ------------------------------ */

function NotificationsSection() {
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => { fetch("/api/notifications?limit=50", { cache: "no-store" }).then((r) => r.json()).then((d) => { setNotifications(Array.isArray(d.notifications) ? d.notifications : []); setUnread(Number(d.unread) || 0); }).catch(() => undefined); }, [revision]);
  async function mark(id?: string) {
    await fetch(id ? `/api/notifications/${id}` : "/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: id ? "{}" : undefined });
    setRevision((r) => r + 1);
  }
  return <>
    <PageHeader title="Notifications" subtitle={`${unread} unread.`} action={unread ? <button onClick={() => mark()} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs text-[#267653]">Mark all as read</button> : undefined} />
    <Panel title={`Notifications (${notifications.length})`}>
      {notifications.length ? <div className="divide-y divide-[#F1F4F2]">{notifications.map((n) => <div key={String(n._id)} className="flex items-start justify-between gap-3 py-3">
        <div><p className="text-[13px] font-medium text-[#34455D]">{String(n.title)} {!n.read && <span className="ml-1 rounded bg-[#EAF5F0] px-1.5 py-0.5 text-[10px] text-[#267653]">New</span>}</p><p className="text-[12px] text-[#71817A]">{String(n.message)}</p><p className="text-[10px] text-[#93A09A]">{dateTime(n.createdAt)}</p></div>
        <div className="flex gap-2">{Boolean(n.link) && <Link href={String(n.link)} className="text-xs text-[#267653]">Open</Link>}{!n.read && <button onClick={() => mark(String(n._id))} className="text-xs text-[#71817A]">Mark read</button>}</div>
      </div>)}</div> : <EmptyState message="No notifications yet." />}
    </Panel>
  </>;
}

/* --------------------------------- settings --------------------------------- */

function SettingsSection() {
  const [data, setData] = useState<{ company: Row; user: Row; preferences: Row } | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/company/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d)).catch(() => undefined); }, []);
  if (!data) return <><PageHeader title="Settings" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const p = data.preferences || {};
  const val = (k: string) => (p[k] === undefined ? "true" : String(Boolean(p[k])));
  return <>
    <PageHeader title="Settings" subtitle="Company preferences, access and security." />
    {message && <div className="mb-4 rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#267653]">{message}</div>}
    <div className="space-y-5">
      <Panel title="Account information"><div className="grid gap-3 text-[13px] sm:grid-cols-2"><Info label="Name" value={String(data.user.fullName || "—")} /><Info label="Email" value={String(data.user.email || "—")} /><Info label="Role" value={<StatusBadge value={data.user.role} />} /><Info label="Company status" value={<StatusBadge value={data.company.status} />} /></div></Panel>
      <FormCard title="Change password" endpoint="/api/auth/password" fields={[
        { name: "currentPassword", label: "Current password", type: "password", required: true },
        { name: "newPassword", label: "New password (8+ characters)", type: "password", required: true },
      ]} onDone={(r) => setMessage(String(r.message || "Password changed."))} />
      <FormCard title="Notification & recruitment preferences" endpoint="/api/company/settings" method="PATCH" fields={[
        { name: "emailNotifications", label: "Email notifications", type: "select", defaultValue: val("emailNotifications"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "applicationAlerts", label: "New application alerts", type: "select", defaultValue: val("applicationAlerts"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "interviewReminders", label: "Interview reminders", type: "select", defaultValue: val("interviewReminders"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "recommendationAlerts", label: "Recommendation alerts", type: "select", defaultValue: val("recommendationAlerts"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "partnershipAlerts", label: "Partnership alerts", type: "select", defaultValue: val("partnershipAlerts"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "weeklyDigest", label: "Weekly digest", type: "select", defaultValue: val("weeklyDigest"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
      ]} onDone={(r) => setMessage(String(r.message || "Settings saved."))} />
      <Panel title="Account actions" action={<button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs text-[#71817A]">Logout</button>}>
        <p className="text-[13px] text-[#71817A]">Company account status changes are managed by platform administrators. Contact support for deactivation.</p>
      </Panel>
    </div>
  </>;
}
