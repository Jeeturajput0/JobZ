"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { DataTable, EmptyState, ErrorBox, FilterBar, PageHeader, Pagination, Panel, StatCard, StatusBadge, type Column } from "@/components/super-admin/ui";

type Row = Record<string, unknown>;
const isId = (v?: string) => Boolean(v && /^[a-f\d]{24}$/i.test(v));
const date = (v: unknown) => v ? new Date(String(v)).toLocaleDateString() : "—";
const dateTime = (v: unknown) => v ? new Date(String(v)).toLocaleString() : "—";

export function JobSeekerSection({ path }: { path: string[] }) {
  const [slug, sub] = path;
  if (!slug || slug === "dashboard") return <OverviewSection />;
  if (slug === "profile") return <ProfileSection />;
  if (slug === "jobs") return <JobsRouter sub={sub} />;
  if (slug === "applications") return <ApplicationsSection />;
  if (slug === "saved-jobs") return <SavedJobsSection />;
  if (slug === "interviews") return <InterviewsSection />;
  if (slug === "progress") return <ProgressSection />;
  if (slug === "counseling") return <CounselingSection />;
  if (slug === "notifications") return <NotificationsSection />;
  if (slug === "settings") return <SettingsSection />;
  return <><PageHeader title="Not found" /><EmptyState message="Choose a section from the sidebar." /></>;
}

/* --------------------------------- helpers -------------------------------- */

type Field = { name: string; label: string; type?: "text" | "textarea" | "select" | "password" | "number" | "date"; options?: { value: string; label: string }[]; required?: boolean; placeholder?: string; defaultValue?: string };

function FormCard({ title, subtitle, endpoint, method = "POST", fields, onDone, confirm, initial }: {
  title: string; subtitle?: string; endpoint: string; method?: "POST" | "PATCH" | "PUT"; fields: Field[];
  onDone?: (result: Record<string, unknown>) => void; confirm?: string; initial?: Record<string, unknown>;
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
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) { setIsError(true); setMessage(result.message || "Request failed."); return; }
      setMessage(result.message || "Saved successfully.");
      onDone?.(result);
    } catch { setIsError(true); setMessage("Could not connect to JobZ."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#172B25]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-[#8A98A5]">{subtitle}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
            <span className="mb-1 block text-xs font-medium text-[#52627A]">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} rows={3} required={f.required} placeholder={f.placeholder} className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]" />
            ) : f.type === "select" ? (
              <select value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} required={f.required} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-[13px]">
                <option value="">Select…</option>
                {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.type || "text"} required={f.required} value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder} className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]" />
            )}
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        {message && <span className={`text-xs ${isError ? "text-[#B25238]" : "text-[#267653]"}`}>{message}</span>}
      </div>
    </form>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-[11px] uppercase tracking-wide text-[#93A09A]">{label}</p><div className="mt-0.5 text-[13px] text-[#34455D]">{value}</div></div>;
}

type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };

/** Works with both `{total}` and the jobs API's `{pagination:{total}}` shape. */
function usePaged<T>(endpoint: string, dataKey: string, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
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

function ListSection({ title, subtitle, endpoint, dataKey, columns, filters, action, refreshKey }: {
  title: string; subtitle?: string; endpoint: string; dataKey: string; columns: Column<Row>[];
  filters?: FilterDef[]; action?: ReactNode; refreshKey?: number;
}) {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
  }, []);
  const params = new URLSearchParams({ ...values, search });
  const res = usePaged<Row>(`${endpoint}?${params.toString()}`, dataKey, [search, values, refreshKey]);
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

/* -------------------------------- overview -------------------------------- */

export function OverviewSection() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/job-seeker/overview", { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => { if (!active) return; if (!ok) throw new Error(d.message || "Unable to load overview."); setData(d); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load overview."); });
    return () => { active = false; };
  }, []);
  if (error) return <><PageHeader title="Dashboard overview" /><ErrorBox message={error} /></>;
  if (!data) return <><PageHeader title="Dashboard overview" subtitle="Loading your career workspace…" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" />)}</div></>;

  const s = (data.stats || {}) as Record<string, number>;
  const completion = (data.completion || {}) as Row;
  const quick = [
    { label: "Complete Profile", href: "/profile/edit" },
    { label: "Upload Resume", href: "/profile/edit#resume" },
    { label: "Browse Jobs", href: "/jobs" },
    { label: "View Applications", href: "/profile/applications" },
    { label: "Manage Saved Jobs", href: "/profile/saved-jobs" },
  ];
  return <>
    <div className="mb-6 rounded-xl border border-[#E5ECE8] bg-white p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3FA47B]">Your career workspace</p>
      <h1 className="mt-1 text-2xl font-semibold text-[#172B25]">Welcome back 👋</h1>
      <p className="mt-1 text-sm text-[#71817A]">Here’s a real-time view of your job search progress.</p>
      <div className="mt-4 flex flex-wrap gap-2">{quick.map((q) => <Link key={q.href} href={q.href} className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#328A66]">{q.label}</Link>)}</div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Profile completion" value={`${s.profileCompletion || 0}%`} />
      <StatCard label="Total applications" value={s.totalApplications || 0} />
      <StatCard label="Under review" value={s.underReview || 0} />
      <StatCard label="Shortlisted" value={s.shortlisted || 0} />
      <StatCard label="Interviews scheduled" value={s.interviewsScheduled || 0} />
      <StatCard label="Offers received" value={s.offersReceived || 0} />
      <StatCard label="Saved jobs" value={s.savedJobs || 0} />
      <StatCard label="Unread notifications" value={s.unreadNotifications || 0} />
    </div>

    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Panel title="Profile completion" action={<Link className="text-xs text-[#267653]" href="/profile/edit">Edit profile</Link>}>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9EFEC]"><div className="h-full rounded-full bg-[#3FA47B]" style={{ width: `${s.profileCompletion || 0}%` }} /></div>
          <span className="text-xs font-semibold text-[#267653]">{s.profileCompletion || 0}%</span>
        </div>
        <p className="text-xs text-[#71817A]">Status: <StatusBadge value={completion.status} /> · Readiness: <StatusBadge value={completion.jobReadiness} /> · Verification: <StatusBadge value={completion.verificationStatus} /></p>
        <p className="mt-3 text-xs font-semibold text-[#52627A]">Missing sections</p>
        <p className="text-[12px] text-[#71817A]">{((completion.missingSections as string[]) || []).join(", ") || "Your profile is complete."}</p>
        <p className="mt-2 text-xs font-semibold text-[#52627A]">Suggested actions</p>
        <ul className="list-disc pl-4 text-[12px] text-[#71817A]">{((completion.suggestedActions as string[]) || []).map((a) => <li key={a}>{a}</li>)}</ul>
      </Panel>

      <Panel title="Recommended jobs" action={<Link className="text-xs text-[#267653]" href="/jobs">Browse all</Link>}>
        {(data.recommendedJobs as Row[] || []).length ? <div className="divide-y divide-[#F1F4F2]">{(data.recommendedJobs as Row[]).map((job) => <div key={String(job.id)} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-[13px] font-medium text-[#34455D]"><Link href={`/jobs/${String(job.id)}`} className="hover:text-[#267653]">{String(job.title)}</Link></p><p className="truncate text-[11px] text-[#8A98A5]">{String(job.company)} · {String(job.location)}</p></div><StatusBadge value={`${job.score}% match`} /></div>)}</div> : <EmptyState message="Add your skills to get personalized recommendations." />}
      </Panel>

      <Panel title="Recent application activity" action={<Link className="text-xs text-[#267653]" href="/profile/applications">View all</Link>}>
        {(data.recentApplications as Row[] || []).length ? <div className="divide-y divide-[#F1F4F2]">{(data.recentApplications as Row[]).map((a) => <div key={String(a.id)} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-[13px] font-medium text-[#34455D]">{String(a.job)}</p><p className="truncate text-[11px] text-[#8A98A5]">{String(a.company)} · {date(a.appliedAt)}</p></div><StatusBadge value={a.status} /></div>)}</div> : <EmptyState message="You haven’t applied to any jobs yet." />}
      </Panel>

      <Panel title="Upcoming interviews">
        {(data.upcomingInterviews as Row[] || []).length ? <div className="divide-y divide-[#F1F4F2]">{(data.upcomingInterviews as Row[]).map((i) => <div key={String(i.id)} className="py-2.5"><p className="text-[13px] font-medium text-[#34455D]">{String(i.job)} · {String(i.company)}</p><p className="text-[11px] text-[#8A98A5]">{dateTime(i.scheduledAt)} · {String(i.mode)}</p></div>)}</div> : <EmptyState message="No upcoming interviews scheduled." />}
      </Panel>

      <Panel title="Recently posted jobs" action={<Link className="text-xs text-[#267653]" href="/jobs">See more</Link>}>
        {(data.recentJobs as Row[] || []).length ? <div className="divide-y divide-[#F1F4F2]">{(data.recentJobs as Row[]).map((j) => <div key={String(j.id)} className="py-2.5"><Link className="text-[13px] font-medium text-[#267653]" href={`/jobs/${String(j.id)}`}>{String(j.title)}</Link><p className="text-[11px] text-[#8A98A5]">{String(j.company)} · {date(j.createdAt)}</p></div>)}</div> : <EmptyState message="No jobs posted yet." />}
      </Panel>

      <Panel title="Saved jobs preview" action={<Link className="text-xs text-[#267653]" href="/profile/saved-jobs">Manage</Link>}>
        {(data.savedJobs as Row[] || []).length ? <div className="divide-y divide-[#F1F4F2]">{(data.savedJobs as Row[]).map((j) => <div key={String(j.id)} className="py-2.5"><p className="text-[13px] font-medium text-[#34455D]">{String(j.title)}</p><p className="text-[11px] text-[#8A98A5]">{String(j.company)} · {String(j.location)}</p></div>)}</div> : <EmptyState message="Save jobs to review them later." />}
      </Panel>
    </div>
  </>;
}

/* --------------------------------- profile --------------------------------- */

export function ProfileSection() {
  const [payload, setPayload] = useState<{ profile: Row; completion: Row } | null>(null);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/candidate/profile", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/candidate/documents", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([p, d]) => {
      if (!active) return;
      setPayload(p);
      setDocuments(Array.isArray(d.documents) ? d.documents : []);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [revision]);

  const profile = payload?.profile || {};
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown) => (Array.isArray(v) ? v.join(", ") : "");

  function reload() { setRevision((r) => r + 1); setMessage("Profile saved."); }

  async function uploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage("File must be 5 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const response = await fetch("/api/candidate/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: "resume", category: "profile", dataUrl: String(reader.result), size: file.size }),
      });
      const result = await response.json();
      setMessage(result.message || (response.ok ? "Resume uploaded and set as preferred." : "Upload failed."));
      if (response.ok) reload();
    };
    reader.readAsDataURL(file);
  }

  async function deleteResume(id: string) {
    if (!window.confirm("Delete this resume? This cannot be undone.")) return;
    const response = await fetch(`/api/candidate/documents/${id}`, { method: "DELETE" });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Resume deleted." : "Delete failed."));
    if (response.ok) reload();
  }

  if (!payload) return <><PageHeader title="My profile" subtitle="Loading your profile…" /><div className="h-40 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const c = (payload.completion || {}) as Row;

  return <>
    <PageHeader title="My profile" subtitle="Keep your profile complete to get better job matches." />
    {message && <div className="mb-4 rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#267653]">{message}</div>}
    <div className="space-y-5">
      <Panel title="Profile health">
        <div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9EFEC]"><div className="h-full rounded-full bg-[#3FA47B]" style={{ width: `${Number(c.percentage) || 0}%` }} /></div><span className="text-xs font-semibold text-[#267653]">{Number(c.percentage) || 0}%</span></div>
        <p className="mt-2 text-xs text-[#71817A]">Missing: {((c.missingSections as string[]) || []).join(", ") || "Nothing"}</p>
      </Panel>

      <FormCard title="Basic information" endpoint="/api/candidate/profile" method="PUT" initial={profile} fields={[
        { name: "fullName", label: "Full name", required: true, defaultValue: s(((payload as unknown as Row).user as Row | undefined)?.fullName) },
        { name: "phone", label: "Phone", defaultValue: s(profile.phone) },
        { name: "headline", label: "Professional headline", defaultValue: s(profile.headline) },
        { name: "city", label: "City", defaultValue: s(profile.city) },
        { name: "state", label: "State", defaultValue: s(profile.state) },
        { name: "country", label: "Country", defaultValue: s(profile.country) },
        { name: "dateOfBirth", label: "Date of birth", type: "date", defaultValue: profile.dateOfBirth ? date(profile.dateOfBirth) : "" },
        { name: "gender", label: "Gender", type: "select", defaultValue: s(profile.gender), options: [{ value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "other", label: "Other" }, { value: "preferNotToSay", label: "Prefer not to say" }] },
        { name: "summary", label: "Career objective / About me", type: "textarea", defaultValue: s(profile.summary) },
        { name: "careerGoals", label: "Career goals", type: "textarea", defaultValue: s(profile.careerGoals) },
      ]} onDone={reload} />

      <FormCard title="Education, skills & preferences" endpoint="/api/candidate/profile" method="PUT" initial={profile} fields={[
        { name: "skills", label: "Skills (comma separated)", defaultValue: arr(profile.skills) },
        { name: "languages", label: "Languages (comma separated)", defaultValue: arr(profile.languages) },
        { name: "preferredLocations", label: "Preferred locations (comma separated)", defaultValue: arr(profile.preferredLocations) },
        { name: "preferredRoles", label: "Preferred roles (comma separated)", defaultValue: arr((profile.jobPreferences as Row)?.roles) },
        { name: "expectedSalary", label: "Expected salary", type: "number", defaultValue: String(profile.expectedSalary || "") },
        { name: "availability", label: "Availability", type: "select", defaultValue: s(profile.availability), options: [{ value: "immediately", label: "Immediately" }, { value: "twoWeeks", label: "Within 2 weeks" }, { value: "oneMonth", label: "Within 1 month" }, { value: "notLooking", label: "Not looking currently" }] },
        { name: "noticePeriod", label: "Notice period", defaultValue: s(profile.noticePeriod) },
        { name: "preferredEmploymentType", label: "Preferred employment type", type: "select", defaultValue: s(profile.preferredEmploymentType), options: [{ value: "full-time", label: "Full-time" }, { value: "part-time", label: "Part-time" }, { value: "internship", label: "Internship" }, { value: "contract", label: "Contract" }] },
        { name: "portfolioUrl", label: "Portfolio URL", defaultValue: s(profile.portfolioUrl) },
        { name: "linkedInUrl", label: "LinkedIn URL", defaultValue: s(profile.linkedInUrl) },
      ]} onDone={reload} />

      <Panel title="Resume management" subtitle="PDF, DOC, DOCX, PNG or JPG up to 5 MB. Stored privately and served only through authorized APIs.">
        <input type="file" accept=".pdf,.doc,.docx,image/png,image/jpeg" onChange={uploadResume} className="mb-4 block w-full max-w-sm text-xs" />
        {documents.filter((d) => d.type === "resume").length ? <div className="divide-y divide-[#F1F4F2]">{documents.filter((d) => d.type === "resume").map((d) => {
          const preferred = String(profile.preferredResumeId || "") === String(d._id);
          return <div key={String(d._id)} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div><p className="text-[13px] font-medium text-[#34455D]">{String(d.name)} {preferred && <span className="ml-1 rounded bg-[#EAF5F0] px-1.5 py-0.5 text-[10px] text-[#267653]">Preferred</span>}</p><p className="text-[11px] text-[#8A98A5]">{String(d.mimeType)} · uploaded {date(d.createdAt)}</p></div>
            <div className="flex gap-2">
              <a href={`/api/candidate/documents/${String(d._id)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 text-xs text-[#267653]">View</a>
              <a href={`/api/candidate/documents/${String(d._id)}`} download={String(d.name)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 text-xs text-[#267653]">Download</a>
              <FormCard title="Use this resume" endpoint="/api/candidate/profile" method="PUT" onDone={reload} fields={[{ name: "preferredResumeId", label: "Preferred resume ID", defaultValue: String(d._id) }]} />
              <button onClick={() => deleteResume(String(d._id))} className="rounded-lg border border-[#F3CFC5] px-3 py-1.5 text-xs text-[#B25238]">Delete</button>
            </div>
          </div>;
        })}</div> : <EmptyState message="No resume uploaded yet." />}
      </Panel>

      <Panel title="Education & experience">
        <p className="mb-2 text-xs font-semibold text-[#52627A]">Education</p>
        {(profile.education as Row[] || []).length ? <DataTable columns={[{ key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }, { key: "year", label: "Year" }, { key: "fieldOfStudy", label: "Field" }]} rows={profile.education as Row[]} /> : <EmptyState message="No education added yet." />}
        <p className="mb-2 mt-4 text-xs font-semibold text-[#52627A]">Experience</p>
        {(profile.experience as Row[] || []).length ? <DataTable columns={[{ key: "company", label: "Company" }, { key: "position", label: "Position" }, { key: "duration", label: "Duration" }]} rows={profile.experience as Row[]} /> : <EmptyState message="No experience added yet." />}
        <p className="mb-2 mt-4 text-xs font-semibold text-[#52627A]">Projects & certifications</p>
        <p className="text-[12px] text-[#71817A]">{(profile.projects as Row[] || []).length} projects · {(profile.certifications as Row[] || []).length} certifications · {(profile.achievements as Row[] || []).length} achievements</p>
      </Panel>
    </div>
  </>;
}

/* --------------------------------- jobs ----------------------------------- */

function JobsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <JobDetailSection id={sub!} />;
  return <BrowseJobs />;
}

export function BrowseJobs() {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
    fetch("/api/saved-jobs", { cache: "no-store" }).then((r) => r.json()).then((d) => setSaved((d.savedJobs || []).map((s: Row) => String(s.id)))).catch(() => undefined);
  }, []);
  const params = new URLSearchParams({ ...values, search });
  const res = usePaged<Row>(`/api/jobs?${params.toString()}`, "jobs", [search, values]);
  const filters: FilterDef[] = [
    { key: "jobType", label: "Employment type", options: [{ value: "full-time", label: "Full-time" }, { value: "part-time", label: "Part-time" }, { value: "internship", label: "Internship" }, { value: "contract", label: "Contract" }] },
    { key: "workMode", label: "Work mode", options: [{ value: "remote", label: "Remote" }, { value: "hybrid", label: "Hybrid" }, { value: "onsite", label: "On-site" }] },
    { key: "experience", label: "Experience", options: [{ value: "fresher", label: "Fresher" }, { value: "junior", label: "Junior" }, { value: "mid", label: "Mid" }, { value: "senior", label: "Senior" }] },
    { key: "postedWithin", label: "Posted", options: [{ value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }] },
    { key: "sort", label: "Sort", options: [{ value: "recommended", label: "Recommended" }, { value: "latest", label: "Latest" }, { value: "salaryHigh", label: "Salary high" }] },
  ];
  async function toggleSave(id: string) {
    const isSaved = saved.includes(id);
    const response = await fetch("/api/saved-jobs", {
      method: isSaved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: isSaved ? undefined : JSON.stringify({ jobId: id }),
    });
    if (response.ok) setSaved((list) => isSaved ? list.filter((x) => x !== id) : [...list, id]);
  }
  return <>
    <PageHeader title="Browse jobs" subtitle="Discover active, approved opportunities from across JobZ." />
    <Panel title={`Jobs found (${res.total})`}>
      <FilterBar search={search} onSearch={setSearch} filters={filters} values={values} onFilter={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={values.location || ""} onChange={(e) => setValues((s) => ({ ...s, location: e.target.value }))} placeholder="Location" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
        <input value={values.skills || ""} onChange={(e) => setValues((s) => ({ ...s, skills: e.target.value }))} placeholder="Skills" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
        <input value={values.salaryMin || ""} onChange={(e) => setValues((s) => ({ ...s, salaryMin: e.target.value }))} placeholder="Min salary" type="number" className="w-32 rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
      </div>
      {res.error && <ErrorBox message={res.error} />}
      {res.loading ? <div className="py-10 text-center text-sm text-[#8A98A5]">Loading jobs…</div> : res.data.length ? (
        <div className="grid gap-3 md:grid-cols-2">{res.data.map((job) => {
          const company = job.companyId as Row | null;
          return <div key={String(job._id)} className="rounded-xl border border-[#E5ECE8] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/jobs/${String(job._id)}`} className="text-[14px] font-semibold text-[#172B25] hover:text-[#267653]">{String(job.title)}</Link>
                <p className="text-[12px] text-[#71817A]">{String(company?.companyName || "Company")} · {String(job.location || "")}</p>
              </div>
              <button onClick={() => toggleSave(String(job._id))} aria-label="Save job" className={`shrink-0 rounded-lg border px-2 py-1 text-xs ${saved.includes(String(job._id)) ? "border-[#3FA47B] bg-[#EAF5F0] text-[#267653]" : "border-[#E5ECE8] text-[#71817A]"}`}>{saved.includes(String(job._id)) ? "Saved" : "Save"}</button>
            </div>
            <p className="mt-2 line-clamp-2 text-[12px] text-[#71817A]">{String(job.shortDescription || job.description || "")}</p>
            <div className="mt-3 flex flex-wrap gap-1">{(job.skills as string[] || []).slice(0, 5).map((s) => <span key={s} className="rounded bg-[#F4F8F6] px-2 py-0.5 text-[10px] text-[#52627A]">{s}</span>)}</div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#8A98A5]"><span>{String(job.jobType)} · {String(job.workMode)} · {String(job.experienceLevel)}</span><span>{date(job.createdAt)}</span></div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#267653]">{job.minSalary || job.maxSalary ? `${job.minSalary || ""}–${job.maxSalary || ""}` : "Salary not disclosed"}</span>
              <Link href={`/jobs/${String(job._id)}`} className="rounded-lg bg-[#3FA47B] px-3 py-1.5 text-xs font-semibold text-white">View & apply</Link>
            </div>
          </div>;
        })}</div>
      ) : <EmptyState message="No jobs match your filters." />}
      <Pagination page={res.page} total={res.total} onChange={res.setPage} />
    </Panel>
  </>;
}

export function JobDetailSection({ id }: { id: string }) {
  const [job, setJob] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resumes, setResumes] = useState<Row[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/jobs/${id}`, { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/candidate/documents", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([j, d]) => {
      if (!active) return;
      if (!j.success) throw new Error(j.message || "Job not found.");
      setJob(j.job);
      const docs = Array.isArray(d.documents) ? d.documents.filter((x: Row) => x.type === "resume") : [];
      setResumes(docs);
      if (docs.length) setSelectedResume(String(docs[0]._id));
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load job."); });
    return () => { active = false; };
  }, [id]);

  async function apply() {
    if (!window.confirm("Submit your application for this job?")) return;
    const response = await fetch("/api/applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id, resumeUrl: selectedResume ? `/api/candidate/documents/${selectedResume}` : "", coverLetter }),
    });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Application submitted." : "Unable to apply."));
  }
  async function save() {
    const response = await fetch("/api/saved-jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Job saved." : "Unable to save job."));
  }
  function share() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: String(job?.title || "Job"), url }).catch(() => undefined);
    else navigator.clipboard?.writeText(url).then(() => setMessage("Link copied to clipboard.")).catch(() => undefined);
  }

  if (error) return <><PageHeader title="Job details" /><ErrorBox message={error} /></>;
  if (!job) return <><PageHeader title="Job details" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const company = job.companyId as Row | null;
  return <>
    <PageHeader title={String(job.title)} subtitle={`${String(company?.companyName || "Company")} · ${String(job.location || "")}`} action={<Link href="/jobs" className="text-xs text-[#267653]">← Back to jobs</Link>} />
    {message && <div className="mb-4 rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#267653]">{message}</div>}
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Panel title="About the role">
          <p className="whitespace-pre-wrap text-[13px] leading-6 text-[#34455D]">{String(job.description || "")}</p>
        </Panel>
        <Panel title="Responsibilities"><ul className="list-disc pl-5 text-[13px] text-[#34455D]">{(job.responsibilities as string[] || []).map((r) => <li key={r}>{r}</li>)}</ul></Panel>
        <Panel title="Required skills"><div className="flex flex-wrap gap-2">{(job.skills as string[] || []).map((s) => <span key={s} className="rounded bg-[#EAF5F0] px-2 py-1 text-xs text-[#267653]">{s}</span>)}</div></Panel>
        <Panel title="Requirements"><ul className="list-disc pl-5 text-[13px] text-[#34455D]">{(job.requirements as string[] || []).map((r) => <li key={r}>{r}</li>)}</ul></Panel>
        <Panel title="Benefits"><ul className="list-disc pl-5 text-[13px] text-[#34455D]">{(job.benefits as string[] || []).map((b) => <li key={b}>{b}</li>)}</ul></Panel>
      </div>
      <div className="space-y-5">
        <Panel title="Job information">
          <div className="space-y-2 text-[13px]">
            <Info label="Company" value={String(company?.companyName || "—")} />
            <Info label="Location" value={String(job.location || "—")} />
            <Info label="Employment type" value={String(job.jobType || "—")} />
            <Info label="Work mode" value={String(job.workMode || "—")} />
            <Info label="Experience" value={String(job.experienceLevel || "—")} />
            <Info label="Salary" value={job.minSalary || job.maxSalary ? `${job.minSalary || ""}–${job.maxSalary || ""}` : "Not disclosed"} />
            <Info label="Deadline" value={job.applicationDeadline ? date(job.applicationDeadline) : "—"} />
            <Info label="Posted" value={date(job.createdAt)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={apply} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-[13px] font-semibold text-white">Apply now</button>
            <button onClick={save} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] text-[#267653]">Save job</button>
            <button onClick={share} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] text-[#267653]">Share</button>
          </div>
        </Panel>
        <Panel title="Apply with your resume">
          {resumes.length ? <select value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)} className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]">
            {resumes.map((r) => <option key={String(r._id)} value={String(r._id)}>{String(r.name)}</option>)}
          </select> : <p className="text-xs text-[#71817A]">Upload a resume in your profile first — or apply without one.</p>}
          <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Cover letter (optional)" rows={4} className="mt-3 w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
          <Link href="/profile/edit" className="mt-2 inline-block text-xs text-[#267653]">Manage resumes →</Link>
        </Panel>
      </div>
    </div>
  </>;
}

/* ------------------------------ applications ------------------------------ */

export function ApplicationsSection() {
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);
  const [message, setMessage] = useState("");
  const columns: Column<Row>[] = [
    { key: "job", label: "Job", render: (r) => <Link className="font-medium text-[#267653]" href={`/jobs/${String((r.jobId as Row)?._id || "")}`}>{String((r.jobId as Row)?.title || "Job")}</Link> },
    { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
    { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source === "recommendation" ? "Counseling Referral" : "Direct Application"} /> },
    { key: "resumeUrl", label: "Resume", render: (r) => r.resumeUrl ? <a className="text-[#267653]" href={String(r.resumeUrl)} target="_blank" rel="noreferrer">View</a> : "—" },
    { key: "interview", label: "Interview", render: (r) => r.interviewDate ? dateTime(r.interviewDate) : "—" },
    { key: "actions", label: "Actions", render: (r) => <button onClick={() => setSelected(r)} className="text-xs text-[#267653]">Track</button> },
  ];
  return <>
    <ListSection title="My applications" subtitle="Track every application and its latest activity." endpoint="/api/applications" dataKey="applications" columns={columns} refreshKey={refresh} filters={[{ key: "status", label: "Status", options: ["applied", "underReview", "shortlisted", "interviewScheduled", "interviewCompleted", "selected", "offerReceived", "hired", "rejected", "withdrawn"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) }]} />
    {selected && <Panel title={`Application timeline — ${String((selected.jobId as Row)?.title || "Job")}`} action={<button onClick={() => setSelected(null)} className="text-xs text-[#71817A]">Close</button>}>
      <div className="space-y-3">
        {(selected.timeline as Row[] || []).length ? (selected.timeline as Row[]).map((t, i) => <div key={i} className="flex gap-3 border-l-2 border-[#E5ECE8] pl-3"><div><p className="text-[13px] font-medium text-[#34455D]"><StatusBadge value={t.status} /></p><p className="text-[11px] text-[#8A98A5]">{dateTime(t.at)} {t.note ? `· ${String(t.note)}` : ""}</p></div></div>) : <EmptyState message="No timeline events yet." />}
      </div>
      {message && <p className="mt-3 text-xs text-[#267653]">{message}</p>}
      {["applied", "underReview", "atsEvaluation"].includes(String(selected.status)) && <button onClick={async () => {
        if (!window.confirm("Withdraw this application? You cannot undo this.")) return;
        const response = await fetch(`/api/applications/${String(selected._id)}/withdraw`, { method: "POST" });
        const result = await response.json();
        setMessage(result.message || (response.ok ? "Application withdrawn." : "Unable to withdraw."));
        if (response.ok) { setRefresh((r) => r + 1); setSelected({ ...selected, status: "withdrawn" }); }
      }} className="mt-4 rounded-lg border border-[#F3CFC5] px-3 py-2 text-xs text-[#B25238]">Withdraw application</button>}
    </Panel>}
  </>;
}

/* -------------------------------- saved jobs ------------------------------ */

export function SavedJobsSection() {
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const res = usePaged<Row>(`/api/saved-jobs?search=${encodeURIComponent(search)}`, "savedJobs", [search, refresh]);
  async function unsave(id: string) {
    const response = await fetch(`/api/saved-jobs?jobId=${id}`, { method: "DELETE" });
    if (response.ok) setRefresh((r) => r + 1);
  }
  return <>
    <PageHeader title="Saved jobs" subtitle="Jobs you bookmarked for later." action={<Link href="/jobs" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Browse jobs</Link>} />
    <Panel title={`Saved jobs (${res.total})`}>
      <FilterBar search={search} onSearch={setSearch} />
      {res.error && <ErrorBox message={res.error} />}
      {res.loading ? <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div> : res.data.length ? (
        <div className="grid gap-3 md:grid-cols-2">{res.data.filter((s) => s.job).map((s) => {
          const job = (s.job || {}) as Row;
          const company = (job.companyId || {}) as Row;
          return <div key={String(s.savedId)} className="rounded-xl border border-[#E5ECE8] bg-white p-4">
            <p className="text-[14px] font-semibold text-[#172B25]"><Link href={`/jobs/${String(job._id || s.id)}`} className="hover:text-[#267653]">{String(job.title || "Job")}</Link></p>
            <p className="text-[12px] text-[#71817A]">{String(company.companyName || "Company")} · {String(job.location || "")}</p>
            <p className="mt-2 line-clamp-2 text-[12px] text-[#71817A]">{String(job.shortDescription || "")}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/jobs/${String(job._id || s.id)}`} className="rounded-lg bg-[#3FA47B] px-3 py-1.5 text-xs font-semibold text-white">View & apply</Link>
              <button onClick={() => unsave(String(job._id || s.id))} className="rounded-lg border border-[#F3CFC5] px-3 py-1.5 text-xs text-[#B25238]">Remove</button>
            </div>
          </div>;
        })}</div>
      ) : <EmptyState message="No saved jobs yet. Save jobs from the browse page." />}
      <Pagination page={res.page} total={res.total} onChange={res.setPage} />
    </Panel>
  </>;
}

/* -------------------------------- interviews ------------------------------ */

export function InterviewsSection() {
  const [period, setPeriod] = useState("");
  const res = usePaged<Row>(`/api/job-seeker/interviews?period=${period}`, "interviews", [period]);
  return <>
    <PageHeader title="Interviews" subtitle="Interviews linked to your authorized applications." />
    <Panel title={`Interviews (${res.total})`} action={<select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-1.5 text-xs">
      <option value="">All</option><option value="upcoming">Upcoming</option><option value="past">Past</option>
    </select>}>
      {res.error && <ErrorBox message={res.error} />}
      {res.loading ? <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div> : res.data.length ? <DataTable columns={[
        { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "Job") },
        { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
        { key: "scheduledAt", label: "Date & time", render: (r) => dateTime(r.scheduledAt) },
        { key: "mode", label: "Type", render: (r) => <StatusBadge value={r.mode} /> },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { key: "interviewers", label: "Interviewers", render: (r) => String((r.interviewerIds as Row[] || []).map((i) => i.fullName).join(", ")) },
        { key: "location", label: "Location / link", render: (r) => String(r.meetingLink || r.location || "—") },
      ]} rows={res.data} /> : <EmptyState message="No interviews recorded for your applications yet." />}
      <Pagination page={res.page} total={res.total} onChange={res.setPage} />
    </Panel>
  </>;
}

/* --------------------------------- progress -------------------------------- */

export function ProgressSection() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/job-seeker/progress", { cache: "no-store" }).then((r) => r.json()).then((d) => d.success ? setData(d) : setError(d.message || "Unable to load progress.")).catch(() => setError("Unable to load progress."));
  }, []);
  if (error) return <><PageHeader title="Career progress" /><ErrorBox message={error} /></>;
  if (!data) return <><PageHeader title="Career progress" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const c = (data.counts || {}) as Record<string, number>;
  const completion = (data.completion || {}) as Row;
  return <>
    <PageHeader title="Career progress" subtitle="Your real career journey so far — no fabricated statistics." />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Profile completion" value={`${completion.percentage || 0}%`} />
      <StatCard label="Applications" value={c.applications || 0} />
      <StatCard label="Interviews" value={c.interviews || 0} />
      <StatCard label="Shortlisted" value={c.shortlisted || 0} />
      <StatCard label="Selected" value={c.selected || 0} />
      <StatCard label="Recommendations" value={c.recommendations || 0} />
      <StatCard label="Assessments" value={c.assessments || 0} />
      <StatCard label="Confirmed placements" value={c.placements || 0} />
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
      <Panel title="Career journey timeline">
        {(data.timeline as Row[] || []).length ? <div className="space-y-4">{(data.timeline as Row[]).map((e, i) => <div key={i} className="flex gap-3 border-l-2 border-[#E5ECE8] pl-4"><div><p className="text-[13px] font-medium text-[#34455D]">{String(e.title)}</p><p className="text-[11px] text-[#8A98A5]">{dateTime(e.date)} · {String(e.detail)}</p></div></div>)}</div> : <EmptyState message="Your journey will appear here as you apply and progress." />}
      </Panel>
      <Panel title="Suggestions for you">
        {(data.suggestions as string[] || []).length ? <ul className="list-disc pl-5 text-[13px] text-[#34455D]">{(data.suggestions as string[]).map((s) => <li key={s} className="mb-2">{s}</li>)}</ul> : <EmptyState message="You are on track. Keep applying!" />}
      </Panel>
    </div>
  </>;
}

/* ------------------------------- counseling -------------------------------- */

export function CounselingSection() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    fetch("/api/job-seeker/counseling", { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d)).catch(() => undefined);
  }, [revision]);
  if (!data) return <><PageHeader title="Counseling support" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const consent = (data.consent || {}) as Row;
  return <>
    <PageHeader title="Counseling support" subtitle="Your counseling organization, counselor, recommendations and consent." />
    {message && <div className="mb-4 rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#267653]">{message}</div>}
    <div className="space-y-5">
      <Panel title="Your counseling connection">
        {data.connected ? <DataTable columns={[
          { key: "organization", label: "Organization" },
          { key: "counselor", label: "Counselor" },
          { key: "counselorEmail", label: "Counselor email" },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
          { key: "completion", label: "Profile completion", render: (r) => `${r.profileCompletion || 0}%` },
        ]} rows={(data.organizations as Row[]) || []} /> : <EmptyState message="You are not connected with a counseling organization yet. Counselors can add you through the platform, or you can opt in below." />}
      </Panel>

      <Panel title="Authorized recommendations">
        {(data.recommendations as Row[] || []).length ? <DataTable columns={[
          { key: "company", label: "Company" },
          { key: "job", label: "Job" },
          { key: "counselor", label: "Counselor" },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
          { key: "consent", label: "Your consent", render: (r) => <StatusBadge value={r.consent} /> },
        ]} rows={data.recommendations as Row[]} /> : <EmptyState message="No counselor recommendations yet." />}
      </Panel>

      <Panel title="Counseling applications & interviews">
        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="mb-2 text-xs font-semibold text-[#52627A]">Applications</p>{(data.applications as Row[] || []).length ? <DataTable columns={[{ key: "job", label: "Job" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={data.applications as Row[]} /> : <EmptyState message="None yet." />}</div>
          <div><p className="mb-2 text-xs font-semibold text-[#52627A]">Interviews</p>{(data.interviews as Row[] || []).length ? <DataTable columns={[{ key: "job", label: "Job" }, { key: "scheduledAt", label: "Date", render: (r) => dateTime(r.scheduledAt) }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={data.interviews as Row[]} /> : <EmptyState message="None yet." />}</div>
        </div>
      </Panel>

      <FormCard title="Your data & consent" subtitle="You control what can be shared with companies." endpoint="/api/job-seeker/counseling" method="PATCH" fields={[
        { name: "shareWithCompanies", label: "Allow sharing profile with companies", type: "select", defaultValue: consent.shareWithCompanies ? "true" : "false", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
        { name: "counselingOptIn", label: "Opt in to counseling support", type: "select", defaultValue: consent.counselingOptIn ? "true" : "false", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
        { name: "sharedFields", label: "Fields allowed to share (comma separated)", defaultValue: (consent.sharedFields as string[] || []).join(", ") },
      ]} onDone={(r) => { setMessage(String(r.message || "Consent saved.")); setRevision((x) => x + 1); }} />
    </div>
  </>;
}

/* ------------------------------ notifications ------------------------------ */

export function NotificationsSection() {
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    fetch("/api/notifications?limit=50", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      setNotifications(Array.isArray(d.notifications) ? d.notifications : []);
      setUnread(Number(d.unread) || 0);
    }).catch(() => setError("Unable to load notifications."));
  }, [revision]);
  async function mark(id?: string) {
    await fetch(id ? `/api/notifications/${id}` : "/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: id ? "{}" : undefined,
    });
    setRevision((r) => r + 1);
  }
  return <>
    <PageHeader title="Notifications" subtitle={`${unread} unread notification(s).`} action={unread ? <button onClick={() => mark()} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs text-[#267653]">Mark all as read</button> : undefined} />
    <Panel title={`Notifications (${notifications.length})`}>
      {error && <ErrorBox message={error} />}
      {notifications.length ? <div className="divide-y divide-[#F1F4F2]">{notifications.map((n) => <div key={String(n._id)} className="flex items-start justify-between gap-3 py-3">
        <div className="min-w-0"><p className="text-[13px] font-medium text-[#34455D]">{String(n.title)} {!n.read && <span className="ml-1 rounded bg-[#EAF5F0] px-1.5 py-0.5 text-[10px] text-[#267653]">New</span>}</p><p className="text-[12px] text-[#71817A]">{String(n.message)}</p><p className="text-[10px] text-[#93A09A]">{dateTime(n.createdAt)}</p></div>
        <div className="flex shrink-0 gap-2">
          {Boolean(n.link) && <Link href={String(n.link)} className="text-xs text-[#267653]">Open</Link>}
          {!n.read && <button onClick={() => mark(String(n._id))} className="text-xs text-[#71817A]">Mark read</button>}
        </div>
      </div>)}</div> : <EmptyState message="You have no notifications yet." />}
    </Panel>
  </>;
}

/* --------------------------------- settings -------------------------------- */

export function SettingsSection() {
  const [data, setData] = useState<{ user: Row; profile: Row } | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/job-seeker/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d)).catch(() => undefined);
  }, []);
  if (!data) return <><PageHeader title="Settings" /><div className="h-60 animate-pulse rounded-xl border border-[#E5ECE8] bg-white" /></>;
  const prefs = (data.profile.settings || {}) as Row;
  const pf = (key: string) => (prefs[key] === undefined ? "true" : String(Boolean(prefs[key])));
  return <>
    <PageHeader title="Settings" subtitle="Account, privacy and notification preferences." />
    {message && <div className="mb-4 rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#267653]">{message}</div>}
    <div className="space-y-5">
      <Panel title="Account information"><div className="grid gap-3 text-[13px] sm:grid-cols-2">
        <Info label="Name" value={String(data.user.fullName || "—")} />
        <Info label="Email" value={String(data.user.email || "—")} />
        <Info label="Phone" value={String(data.user.phone || "—")} />
        <Info label="Status" value={<StatusBadge value={data.user.status} />} />
      </div></Panel>

      <FormCard title="Change password" endpoint="/api/auth/password" fields={[
        { name: "currentPassword", label: "Current password", type: "password", required: true },
        { name: "newPassword", label: "New password (8+ characters)", type: "password", required: true },
      ]} onDone={(r) => setMessage(String(r.message || "Password changed."))} />

      <FormCard title="Privacy & notification preferences" endpoint="/api/job-seeker/settings" method="PATCH" fields={[
        { name: "emailNotifications", label: "Email notifications", type: "select", defaultValue: pf("emailNotifications"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "applicationUpdates", label: "Application updates", type: "select", defaultValue: pf("applicationUpdates"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "interviewReminders", label: "Interview reminders", type: "select", defaultValue: pf("interviewReminders"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "marketing", label: "Marketing emails", type: "select", defaultValue: pf("marketing"), options: [{ value: "true", label: "On" }, { value: "false", label: "Off" }] },
        { name: "profileVisibility", label: "Public profile visibility", type: "select", defaultValue: pf("profileVisibility"), options: [{ value: "true", label: "Visible" }, { value: "false", label: "Private" }] },
        { name: "dataSharing", label: "Allow data sharing", type: "select", defaultValue: pf("dataSharing"), options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
        { name: "resumePublic", label: "Make resume link public", type: "select", defaultValue: data.profile.resumePublic ? "true" : "false", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
        { name: "consentShareWithCompanies", label: "Share profile with companies", type: "select", defaultValue: data.profile.consentShareWithCompanies ? "true" : "false", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
      ]} onDone={(r) => setMessage(String(r.message || "Settings saved."))} />

      <Panel title="Account actions" action={<button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-xs text-[#71817A]">Logout</button>}>
        <p className="text-[13px] text-[#71817A]">Account deactivation is handled by platform administrators. Contact support if you need to deactivate your account.</p>
      </Panel>
    </div>
  </>;
}
