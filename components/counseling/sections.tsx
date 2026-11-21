"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CounselingOverview } from "./overview";
import { DataTable, EmptyState, ErrorBox, FilterBar, PageHeader, Pagination, Panel, StatusBadge, useResource, type Column } from "@/components/super-admin/ui";

type Row = Record<string, unknown>;
const isId = (v?: string) => Boolean(v && /^[a-f\d]{24}$/i.test(v));
const date = (v: unknown) => v ? new Date(String(v)).toLocaleDateString() : "—";
const dateTime = (v: unknown) => v ? new Date(String(v)).toLocaleString() : "—";

export function CounselingSection({ path }: { path: string[] }) {
  const [slug, sub] = path;
  if (!slug || slug === "dashboard") return <CounselingOverview />;
  if (slug === "candidates") return <CandidatesRouter sub={sub} />;
  if (slug === "team") return <TeamRouter sub={sub} />;
  if (slug === "companies") return <CompaniesRouter sub={sub} />;
  if (slug === "partnerships") return <PartnershipsRouter sub={sub} />;
  if (slug === "hiring-requests") return <HiringRequestsRouter sub={sub} />;
  if (slug === "recommendations") return <RecommendationsRouter sub={sub} />;
  if (slug === "applications") return <ApplicationsSection />;
  if (slug === "interviews") return <InterviewsSection />;
  if (slug === "placements") return <PlacementsRouter sub={sub} />;
  if (slug === "notifications") return <NotificationsSection />;
  if (slug === "settings") return <SettingsSection />;
  return <><PageHeader title="Not found" subtitle="Choose a section from the sidebar." /><EmptyState message="This section does not exist." /></>;
}

/* --------------------------------- helpers -------------------------------- */

type Field = { name: string; label: string; type?: "text" | "textarea" | "select" | "password" | "number" | "date"; options?: { value: string; label: string }[]; required?: boolean; placeholder?: string };

function FormCard({ title, subtitle, endpoint, method = "POST", fields, onDone, confirm }: {
  title: string; subtitle?: string; endpoint: string; method?: "POST" | "PATCH" | "PUT";
  fields: Field[]; onDone?: () => void; confirm?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, ""])));
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
      onDone?.();
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
              <textarea value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} rows={3} placeholder={f.placeholder} className="w-full rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] outline-none focus:border-[#3FA47B]" />
            ) : f.type === "select" ? (
              <select value={values[f.name] || ""} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-[13px]">
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

type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };

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
  const res = useResource<Row>(`${endpoint}?${params.toString()}`, dataKey, [search, values, refreshKey]);
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

/* -------------------------------- candidates ------------------------------ */

function CandidatesRouter({ sub }: { sub?: string }) {
  if (sub === "add") return <AddCandidate />;
  if (isId(sub)) return <CandidateDetail id={sub!} />;
  return <ListSection title="Candidates" subtitle="Candidates associated with your organization." endpoint="/api/counseling/candidates" dataKey="candidates" columns={candidateColumns} filters={[{ key: "verification", label: "Verification", options: [{ value: "verified", label: "Verified" }, { value: "pendingReview", label: "Pending" }] }]} action={<Link href="/counseling/candidates/add" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Add candidate</Link>} />;
}

const candidateColumns: Column<Row>[] = [
  { key: "fullName", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/counseling/candidates/${String(r.id || r._id)}`}>{String(r.fullName || "—")}</Link> },
  { key: "email", label: "Email" },
  { key: "skills", label: "Skills", render: (r) => String((r.skills as string[] || []).slice(0, 4).join(", ")) },
  { key: "experience", label: "Experience", render: (r) => `${(r.experience as Row[] || []).length} entries` },
  { key: "education", label: "Education", render: (r) => `${(r.education as Row[] || []).length} entries` },
  { key: "assigned", label: "Counselor", render: (r) => String((r.assignedCounselor as Row)?.fullName || "Unassigned") },
  { key: "completion", label: "Profile", render: (r) => `${String(r.profileCompletion || 0)}%` },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.workflowStatus || r.status} /> },
  { key: "createdAt", label: "Added", render: (r) => date(r.createdAt) },
];

function AddCandidate() {
  const [counselors, setCounselors] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/counseling/team/members", { cache: "no-store" }).then((r) => r.json()).then((d) => setCounselors(Array.isArray(d.members) ? d.members : [])).catch(() => undefined);
  }, []);
  return <>
    <PageHeader title="Add candidate" subtitle="Existing JobZ candidates are associated, not duplicated." action={<Link href="/counseling/candidates" className="text-xs text-[#267653]">← Back</Link>} />
    <FormCard title="Candidate details" endpoint="/api/counseling/candidates" fields={[
      { name: "fullName", label: "Full name", required: true },
      { name: "email", label: "Email", required: true },
      { name: "phone", label: "Phone" },
      { name: "skills", label: "Skills (comma separated)" },
      { name: "preferredJob", label: "Preferred job" },
      { name: "preferredLocation", label: "Preferred location" },
      { name: "assignedTo", label: "Assign counselor", type: "select", options: counselors.map((m) => ({ value: String((m.userId as Row)?._id || m.userId), label: String((m.userId as Row)?.fullName || "Counselor") })) },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "password", label: "Temporary password (new candidates only)" },
    ]} />
  </>;
}

function CandidateDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Candidate details" action={<Link href="/counseling/candidates" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/counseling/candidates/${id}`}>
      {(d) => {
        const c = (d.candidate as Row) || {};
        const rec = (d.record as Row) || {};
        const completion = (d.completion as Row) || {};
        return <div className="space-y-5">
          <Panel title="Profile">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Name" value={String(c.fullName || "—")} />
              <Info label="Email" value={String(c.email || "—")} />
              <Info label="Profile completion" value={`${completion.percentage ?? 0}%`} />
              <Info label="Job readiness" value={<StatusBadge value={completion.jobReadiness} />} />
              <Info label="Verification" value={<StatusBadge value={c.verificationStatus} />} />
              <Info label="Workflow" value={<StatusBadge value={rec.workflowStatus} />} />
            </div>
          </Panel>
          <Panel title="Workforce & profile data">
            <p className="text-[13px] text-[#34455D]"><b>Skills:</b> {String((c.skills as string[] || []).join(", ") || "—")}</p>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Education</p>{(c.education as Row[] || []).length ? <DataTable columns={[{ key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }, { key: "year", label: "Year" }]} rows={c.education as Row[]} /> : <EmptyState message="No education added." />}</div>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Experience</p>{(c.experience as Row[] || []).length ? <DataTable columns={[{ key: "company", label: "Company" }, { key: "position", label: "Position" }, { key: "duration", label: "Duration" }]} rows={c.experience as Row[]} /> : <EmptyState message="No experience added." />}</div>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Certifications</p>{(c.certifications as Row[] || []).length ? <DataTable columns={[{ key: "name", label: "Certification" }, { key: "issuer", label: "Issuer" }, { key: "year", label: "Year" }]} rows={c.certifications as Row[]} /> : <EmptyState message="No certifications added." />}</div>
          </Panel>
          <Panel title="Assessments">{(c.assessments as Row[] || []).length ? <DataTable columns={[{ key: "percentage", label: "Score", render: (r) => `${r.percentage}%` }, { key: "completedAt", label: "Date", render: (r) => date(r.completedAt) }]} rows={c.assessments as Row[]} /> : <EmptyState message="No assessment results." />}</Panel>
          <Panel title="Progress & assignment">
            <FormCard title="Update workflow" endpoint={`/api/counseling/candidates/${id}/workflow`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} fields={[
              { name: "workflowStatus", label: "Candidate status", type: "select", options: ["newCandidate", "profileIncomplete", "profileReview", "profileEnhancement", "verificationPending", "assessmentPending", "assessmentCompleted", "jobReady", "jobMatching", "recommendedToCompany", "interviewScheduled", "selected", "hired", "onHold"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) },
              { name: "assignedTo", label: "Counselor user ID" },
              { name: "note", label: "Note", type: "textarea" },
              { name: "task", label: "New task title (optional)" },
            ]} />
          </Panel>
          <CounselingNotes candidateId={id} onDone={() => setRefresh((r) => r + 1)} />
          <Panel title="Applications">{(d.applications as Row[] || []).length ? <DataTable columns={[{ key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.applications as Row[]} /> : <EmptyState message="No applications yet." />}</Panel>
          <Panel title="Recommendations">{(d.recommendations as Row[] || []).length ? <DataTable columns={[{ key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No recommendations yet." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

function CounselingNotes({ candidateId, onDone }: { candidateId: string; onDone: () => void }) {
  const [notes, setNotes] = useState<Row[]>([]);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    fetch(`/api/counseling/candidates/${candidateId}/notes`, { cache: "no-store" })
      .then((r) => r.json()).then((d) => setNotes(Array.isArray(d.notes) ? d.notes : [])).catch(() => undefined);
  }, [candidateId, revision]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch(`/api/counseling/candidates/${candidateId}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: text }),
    });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Note added." : "Unable to add note."));
    if (response.ok) { setText(""); setRevision((r) => r + 1); onDone(); }
  }
  return <Panel title="Counseling notes" subtitle="Private to authorized counseling team members.">
    {notes.length ? <div className="space-y-2">{notes.map((n, i) => <div key={i} className="rounded-lg border border-[#E9EFEC] bg-[#FBFDFC] px-3 py-2 text-[13px] text-[#34455D]">{String(n.note)}</div>)}</div> : <EmptyState message="No counseling notes yet." />}
    <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
      <input required value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a professional counseling note" className="min-w-[240px] flex-1 rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
      <button className="rounded-lg bg-[#3FA47B] px-4 py-2 text-[13px] font-semibold text-white">Add note</button>
    </form>
    {message && <p className="mt-2 text-xs text-[#267653]">{message}</p>}
  </Panel>;
}

/* ---------------------------------- team ---------------------------------- */

function TeamRouter({ sub }: { sub?: string }) {
  if (sub === "add") return <AddTeamMember />;
  return <>
    <ListSection title="My team" subtitle="Counselors and team members in your organization." endpoint="/api/counseling/team/members" dataKey="members" columns={teamColumns} action={<Link href="/counseling/team/add" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Add member</Link>} />
    <div className="mt-5"><TeamWorkload /></div>
  </>;
}

const teamColumns: Column<Row>[] = [
  { key: "name", label: "Member", render: (r) => String((r.userId as Row)?.fullName || "—") },
  { key: "email", label: "Email", render: (r) => String((r.userId as Row)?.email || "—") },
  { key: "title", label: "Role" },
  { key: "candidates", label: "Assigned candidates", render: (r) => `${(r.assignedCandidates as Row[] || []).length}` },
  { key: "permissions", label: "Permissions", render: (r) => `${(r.permissions as string[] || []).length}` },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
];

function AddTeamMember() {
  const [roles, setRoles] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/counseling/roles", { cache: "no-store" }).then((r) => r.json()).then((d) => setRoles(Array.isArray(d.roles) ? d.roles : [])).catch(() => undefined);
  }, []);
  return <>
    <PageHeader title="Add team member" subtitle="Creates an individual login inside your organization." action={<Link href="/counseling/team" className="text-xs text-[#267653]">← Back</Link>} />
    <FormCard title="Member details" endpoint="/api/counseling/team/members" fields={[
      { name: "fullName", label: "Full name", required: true },
      { name: "email", label: "Email", required: true },
      { name: "title", label: "Role title" },
      { name: "roleKey", label: "Role", type: "select", options: roles.map((r) => ({ value: String(r.key), label: String(r.name) })) },
      { name: "permissions", label: "Permission keys (comma separated)" },
      { name: "password", label: "Temporary password" },
    ]} />
  </>;
}

function TeamWorkload() {
  const [data, setData] = useState<{ members: Row[]; activity: Row[]; interviews?: number } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/counseling/team/overview", { cache: "no-store" }).then((r) => r.json()).then((d) => setData(d)).catch(() => setError("Unable to load workload."));
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!data) return <div className="py-8 text-center text-sm text-[#8A98A5]">Loading workload…</div>;
  return <div className="space-y-5">
    <Panel title="Counselor workload">
      {data.members?.length ? <DataTable columns={[
        { key: "name", label: "Counselor" },
        { key: "assignedCandidates", label: "Candidates" },
        { key: "recommendations", label: "Recommendations" },
        { key: "placements", label: "Placements" },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      ]} rows={data.members} /> : <EmptyState message="No team members yet." />}
    </Panel>
    <Panel title="Team activity">
      {data.activity?.length ? <DataTable columns={[{ key: "action", label: "Action" }, { key: "description", label: "Details" }, { key: "createdAt", label: "Date", render: (r) => dateTime(r.createdAt) }]} rows={data.activity} /> : <EmptyState message="No team activity yet." />}
    </Panel>
  </div>;
}

/* -------------------------------- companies ------------------------------- */

function CompaniesRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <CompanyDetail id={sub!} />;
  return <ListSection title="Discover companies" subtitle="Verified companies on JobZ. Send a partnership request to collaborate." endpoint="/api/counseling/companies" dataKey="companies" columns={companyColumns} />;
}

const companyColumns: Column<Row>[] = [
  { key: "name", label: "Company", render: (r) => <Link className="font-medium text-[#267653]" href={`/counseling/companies/${String(r._id)}`}>{String(r.name || "—")}</Link> },
  { key: "industry", label: "Industry" },
  { key: "location", label: "Location" },
  { key: "activeJobs", label: "Open jobs" },
  { key: "partnershipStatus", label: "Partnership", render: (r) => <StatusBadge value={r.partnershipStatus} /> },
];

function CompanyDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Company details" action={<Link href="/counseling/companies" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/counseling/companies/${id}`}>
      {(d) => {
        const c = (d.company as Row) || {};
        return <div className="space-y-5">
          <Panel title="Company profile">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Name" value={String(c.name || "—")} />
              <Info label="Industry" value={String(c.industry || (c.employerProfileId as Row)?.industry || "—")} />
              <Info label="Location" value={String((c.employerProfileId as Row)?.location || "—")} />
              <Info label="Description" value={String((c.employerProfileId as Row)?.description || "—")} />
              <Info label="Partnership" value={<StatusBadge value={(d.partnership as Row)?.status || "none"} />} />
            </div>
          </Panel>
          <Panel title="Available jobs">{(d.jobs as Row[]).length ? <DataTable columns={[{ key: "title", label: "Title" }, { key: "location", label: "Location" }, { key: "jobType", label: "Type" }, { key: "skills", label: "Skills" }]} rows={d.jobs as Row[]} /> : <EmptyState message="No open jobs at this company." />}</Panel>
          <Panel title="Hiring information">{(d.hiringRequests as Row[]).length ? <DataTable columns={[{ key: "jobTitle", label: "Role" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "numberOfOpenings", label: "Openings" }]} rows={d.hiringRequests as Row[]} /> : <EmptyState message="No hiring requests from this company." />}</Panel>
          <FormCard title="Send partnership request" subtitle="Creates a real pending partnership record." endpoint="/api/counseling/partnerships" onDone={() => setRefresh((r) => r + 1)} fields={[
            { name: "companyId", label: "Company ID", required: true, placeholder: String(c._id || "") },
            { name: "message", label: "Message", type: "textarea" },
          ]} />
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------- partnerships ------------------------------ */

function PartnershipsRouter({ sub }: { sub?: string }) {
  if (sub === "send") return <SendPartnership />;
  if (isId(sub)) return <PartnershipDetail id={sub!} />;
  return <>
    <ListSection title="Partnerships" subtitle="Company relationships for your organization." endpoint="/api/counseling/partnerships" dataKey="partnerships" columns={partnershipColumns} filters={[{ key: "status", label: "Status", options: [{ value: "pending", label: "Pending" }, { value: "accepted", label: "Accepted" }, { value: "rejected", label: "Rejected" }, { value: "suspended", label: "Suspended" }, { value: "terminated", label: "Terminated" }] }]} action={<Link href="/counseling/partnerships/send" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Send request</Link>} />
  </>;
}

const partnershipColumns: Column<Row>[] = [
  { key: "company", label: "Company", render: (r) => <Link className="font-medium text-[#267653]" href={`/counseling/partnerships/${String(r._id)}`}>{String((r.companyId as Row)?.name || "—")}</Link> },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "initiatedBy", label: "Initiated by", render: (r) => String(r.initiatedBy || "—") },
  { key: "requestedBy", label: "Requester", render: (r) => String((r.requestedBy as Row)?.fullName || "—") },
  { key: "createdAt", label: "Date", render: (r) => date(r.createdAt) },
];

function SendPartnership() {
  const [companies, setCompanies] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/counseling/companies?limit=50", { cache: "no-store" }).then((r) => r.json()).then((d) => setCompanies(Array.isArray(d.companies) ? d.companies : [])).catch(() => undefined);
  }, []);
  return <>
    <PageHeader title="Send partnership request" action={<Link href="/counseling/partnerships" className="text-xs text-[#267653]">← Back</Link>} />
    <FormCard title="Partnership request" subtitle="Only verified, active companies are eligible." endpoint="/api/counseling/partnerships" fields={[
      { name: "companyId", label: "Company", type: "select", required: true, options: companies.map((c) => ({ value: String(c._id), label: String(c.name) })) },
      { name: "message", label: "Message", type: "textarea" },
    ]} />
  </>;
}

function PartnershipDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Partnership details" action={<Link href="/counseling/partnerships" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/counseling/partnerships/${id}`}>
      {(d) => {
        const p = (d.partnership as Row) || {};
        return <div className="space-y-5">
          <Panel title="Partnership">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Company" value={String((p.companyId as Row)?.name || (d.company as Row)?.name || "—")} />
              <Info label="Status" value={<StatusBadge value={p.status} />} />
              <Info label="Initiated by" value={String(p.initiatedBy || "—")} />
              <Info label="Date" value={date(p.createdAt)} />
              <Info label="Notes" value={String(p.notes || "—")} />
            </div>
            {p.status === "pending" && p.initiatedBy !== "counseling" && <div className="mt-4"><FormCard title="Respond to request" endpoint="/api/counseling/partnerships" method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this partnership request?" fields={[
              { name: "partnershipId", label: "Partnership ID", required: true, placeholder: id },
              { name: "status", label: "Decision", type: "select", required: true, options: [{ value: "accepted", label: "Accept" }, { value: "rejected", label: "Reject" }] },
              { name: "note", label: "Note", type: "textarea" },
            ]} /></div>}
          </Panel>
          <Panel title="Jobs shared">{(d.jobs as Row[]).length ? <DataTable columns={[{ key: "title", label: "Job" }, { key: "location", label: "Location" }, { key: "jobType", label: "Type" }]} rows={d.jobs as Row[]} /> : <EmptyState message="No jobs shared yet." />}</Panel>
          <Panel title="Hiring requests">{(d.hiringRequests as Row[]).length ? <DataTable columns={[{ key: "jobTitle", label: "Role" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.hiringRequests as Row[]} /> : <EmptyState message="No hiring requests." />}</Panel>
          <Panel title="Candidates recommended">{(d.recommendations as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No candidates recommended through this partnership." />}</Panel>
          <Panel title="Interviews">{(d.interviews as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "scheduledAt", label: "Date", render: (r) => dateTime(r.scheduledAt) }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.interviews as Row[]} /> : <EmptyState message="No interviews tracked." />}</Panel>
          <Panel title="Confirmed placements">{(d.placements as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.placements as Row[]} /> : <EmptyState message="No placements recorded." />}</Panel>
          <Panel title="Partnership history">{(d.activity as Row[]).length ? <DataTable columns={[{ key: "action", label: "Action" }, { key: "description", label: "Details" }, { key: "createdAt", label: "Date", render: (r) => dateTime(r.createdAt) }]} rows={d.activity as Row[]} /> : <EmptyState message="No history recorded." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------ hiring requests ---------------------------- */

function HiringRequestsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <HiringRequestDetail id={sub!} />;
  return <ListSection title="Hiring requests" subtitle="Requests received from companies." endpoint="/api/counseling/hiring-requests" dataKey="requests" columns={hiringColumns} filters={[{ key: "status", label: "Status", options: ["draft", "submitted", "underReview", "assigned", "sourcing", "candidatesRecommended", "interviewing", "completed", "cancelled"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) }, { key: "priority", label: "Priority", options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }] }]} />;
}

const hiringColumns: Column<Row>[] = [
  { key: "jobTitle", label: "Role", render: (r) => <Link className="font-medium text-[#267653]" href={`/counseling/hiring-requests/${String(r._id)}`}>{String(r.jobTitle || "—")}</Link> },
  { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
  { key: "numberOfOpenings", label: "Openings" },
  { key: "priority", label: "Priority", render: (r) => <StatusBadge value={r.priority} /> },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "assignedTo", label: "Counselor", render: (r) => String((r.assignedTo as Row)?.fullName || "Unassigned") },
  { key: "createdAt", label: "Received", render: (r) => date(r.createdAt) },
];

function HiringRequestDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  const [members, setMembers] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/counseling/team/members", { cache: "no-store" }).then((r) => r.json()).then((d) => setMembers(Array.isArray(d.members) ? d.members : [])).catch(() => undefined);
  }, []);
  return <>
    <PageHeader title="Hiring request details" action={<Link href="/counseling/hiring-requests" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/counseling/hiring-requests/${id}`}>
      {(d) => {
        const h = (d.request as Row) || {};
        return <div className="space-y-5">
          <Panel title="Request">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Role" value={String(h.jobTitle || "—")} />
              <Info label="Company" value={String((h.createdBy as Row)?.fullName || "—")} />
              <Info label="Openings" value={String(h.numberOfOpenings || 0)} />
              <Info label="Priority" value={<StatusBadge value={h.priority} />} />
              <Info label="Status" value={<StatusBadge value={h.status} />} />
              <Info label="Location" value={String(h.jobLocation || "—")} />
              <Info label="Deadline" value={h.hiringDeadline ? date(h.hiringDeadline) : "—"} />
              <Info label="Required skills" value={String((h.requiredSkills as string[] || []).join(", "))} />
              <Info label="Experience" value={String(h.experienceRequirements || "—")} />
              <Info label="Education" value={String(h.educationRequirements || "—")} />
            </div>
          </Panel>
          <Panel title="Manage request">
            <FormCard title="Accept, decline or assign" endpoint={`/api/counseling/hiring-requests/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} fields={[
              { name: "status", label: "Status", type: "select", options: ["underReview", "assigned", "sourcing", "candidatesRecommended", "interviewing", "completed", "cancelled"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) },
              { name: "assignedTo", label: "Assign counselor", type: "select", options: members.map((m) => ({ value: String((m.userId as Row)?._id || m.userId), label: String((m.userId as Row)?.fullName || "Counselor") })) },
              { name: "note", label: "Note", type: "textarea" },
            ]} />
          </Panel>
          <Panel title="Candidates recommended">{(d.recommendations as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No candidates recommended for this request." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------ recommendations ---------------------------- */

function RecommendationsRouter({ sub }: { sub?: string }) {
  if (sub === "new") return <NewRecommendation />;
  if (isId(sub)) return <RecommendationDetail id={sub!} />;
  return <ListSection title="Recommendations" subtitle="Candidates recommended to partnered companies." endpoint="/api/counseling/recommendations" dataKey="recommendations" columns={recommendationColumns} filters={[{ key: "status", label: "Status", options: ["recommended", "candidateApprovalPending", "candidateAccepted", "sentToCompany", "companyReviewing", "shortlisted", "interviewScheduled", "selected", "rejected", "hired"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) }]} action={<Link href="/counseling/recommendations/new" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Recommend candidate</Link>} />;
}

const recommendationColumns: Column<Row>[] = [
  { key: "candidate", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/counseling/recommendations/${String(r._id)}`}>{String((r.candidateId as Row)?.fullName || "—")}</Link> },
  { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
  { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
  { key: "counselor", label: "Counselor", render: (r) => String((r.counselorId as Row)?.fullName || "—") },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "consent", label: "Consent", render: (r) => <StatusBadge value={r.candidateConsent} /> },
  { key: "createdAt", label: "Date", render: (r) => date(r.createdAt) },
];

function NewRecommendation() {
  const [candidates, setCandidates] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/counseling/candidates?limit=100", { cache: "no-store" }).then((r) => r.json()).then((d) => setCandidates(Array.isArray(d.candidates) ? d.candidates : [])).catch(() => undefined);
  }, []);
  return <>
    <PageHeader title="Recommend a candidate" subtitle="Requires an accepted partnership with the company." action={<Link href="/counseling/recommendations" className="text-xs text-[#267653]">← Back</Link>} />
    <FormCard title="Recommendation" endpoint="/api/counseling/recommendations" fields={[
      { name: "candidateId", label: "Candidate", type: "select", required: true, options: candidates.map((c) => ({ value: String(c.id || c._id), label: String(c.fullName || "Candidate") })) },
      { name: "companyId", label: "Company ID", required: true },
      { name: "jobId", label: "Job ID (optional)" },
      { name: "hiringRequestId", label: "Hiring request ID (optional)" },
      { name: "matchScore", label: "Match score", type: "number" },
      { name: "note", label: "Recommendation notes", type: "textarea" },
    ]} />
  </>;
}

function RecommendationDetail({ id }: { id: string }) {
  return <>
    <PageHeader title="Recommendation details" action={<Link href="/counseling/recommendations" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel endpoint={`/api/counseling/recommendations/${id}`}>
      {(d) => {
        const rec = (d.recommendation as Row) || {};
        return <Panel title="Recommendation">
          <div className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Info label="Candidate" value={String((rec.candidateId as Row)?.fullName || "—")} />
            <Info label="Company" value={String((rec.companyId as Row)?.name || "—")} />
            <Info label="Job" value={String((rec.jobId as Row)?.title || "—")} />
            <Info label="Counselor" value={String((rec.counselorId as Row)?.fullName || "—")} />
            <Info label="Status" value={<StatusBadge value={rec.status} />} />
            <Info label="Consent" value={<StatusBadge value={rec.candidateConsent} />} />
            <Info label="Note" value={String(rec.note || "—")} />
          </div>
        </Panel>;
      }}
    </DetailPanel>
  </>;
}

/* -------------------------------- applications ---------------------------- */

function ApplicationsSection() {
  return <ListSection title="Applications" subtitle="Applications and referrals linked to your organization." endpoint="/api/counseling/applications" dataKey="applications" columns={[
    { key: "candidate", label: "Candidate", render: (r) => String((r.jobSeekerId as Row)?.fullName || "—") },
    { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
    { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
    { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source === "recommendation" ? "Counseling Referral" : r.source} /> },
    { key: "counselor", label: "Counselor" },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) },
  ]} filters={[{ key: "status", label: "Status", options: ["applied", "shortlisted", "interviewScheduled", "selected", "hired", "rejected"].map((s) => ({ value: s, label: s.replace(/([A-Z])/g, " ") })) }]} />;
}

/* --------------------------------- interviews ------------------------------ */

function InterviewsSection() {
  return <ListSection title="Interviews" subtitle="Interviews tracked through your recommendations. Official scheduling remains with companies." endpoint="/api/counseling/interviews" dataKey="interviews" columns={[
    { key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") },
    { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
    { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
    { key: "scheduledAt", label: "Date", render: (r) => dateTime(r.scheduledAt) },
    { key: "mode", label: "Type", render: (r) => <StatusBadge value={r.mode} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ]} filters={[{ key: "status", label: "Status", options: [{ value: "scheduled", label: "Scheduled" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }] }]} />;
}

/* --------------------------------- placements ------------------------------ */

function PlacementsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <PlacementDetail id={sub!} />;
  return <>
    <ListSection title="Placement records" subtitle="Confirmed joining records from your referrals." endpoint="/api/counseling/placements" dataKey="placements" columns={placementColumns} filters={[{ key: "status", label: "Status", options: [{ value: "recorded", label: "Recorded" }, { value: "confirmed", label: "Confirmed" }, { value: "cancelled", label: "Cancelled" }] }]} />
    <div className="mt-5"><RecordPlacement /></div>
  </>;
}

function RecordPlacement() {
  const [recs, setRecs] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/counseling/recommendations?limit=100", { cache: "no-store" }).then((r) => r.json()).then((d) => setRecs(Array.isArray(d.recommendations) ? d.recommendations : [])).catch(() => undefined);
  }, []);
  return <FormCard title="Record a placement" subtitle="Only recommendations with a selection or hiring outcome can be recorded. Joining is confirmed separately." endpoint="/api/counseling/placements" fields={[
    { name: "recommendationId", label: "Recommendation", type: "select", required: true, options: recs.map((r) => ({ value: String(r._id), label: `${String((r.candidateId as Row)?.fullName || "Candidate")} — ${String(r.status || "")}` })) },
    { name: "note", label: "Note", type: "textarea" },
  ]} />;
}

const placementColumns: Column<Row>[] = [
  { key: "candidate", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/counseling/placements/${String(r._id)}`}>{String((r.candidateId as Row)?.fullName || "—")}</Link> },
  { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
  { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
  { key: "counselor", label: "Counselor", render: (r) => String((r.counselorId as Row)?.fullName || "—") },
  { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source} /> },
  { key: "joiningDate", label: "Joining", render: (r) => r.joiningDate ? date(r.joiningDate) : "—" },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
];

function PlacementDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Placement details" action={<Link href="/counseling/placements" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/counseling/placements/${id}`}>
      {(d) => {
        const p = (d.placement as Row) || {};
        return <div className="space-y-5">
          <Panel title="Placement record">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Candidate" value={String((p.candidateId as Row)?.fullName || "—")} />
              <Info label="Company" value={String((p.companyId as Row)?.name || "—")} />
              <Info label="Job" value={String((p.jobId as Row)?.title || "—")} />
              <Info label="Counselor" value={String((p.counselorId as Row)?.fullName || "—")} />
              <Info label="Source" value={<StatusBadge value={p.source} />} />
              <Info label="Status" value={<StatusBadge value={p.status} />} />
              <Info label="Joining date" value={p.joiningDate ? date(p.joiningDate) : "—"} />
              <Info label="Notes" value={String(p.notes || "—")} />
            </div>
          </Panel>
          {p.status !== "confirmed" && <FormCard title="Confirm joining" subtitle="Records a real joining date. A candidate is not placed until this is confirmed." endpoint={`/api/counseling/placements/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Confirm this candidate's joining?" fields={[
            { name: "joiningDate", label: "Joining date", type: "date", required: true },
            { name: "note", label: "Note", type: "textarea" },
          ]} />}
          <Panel title="Placement history">{(p.history as Row[] || []).length ? <DataTable columns={[{ key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "note", label: "Note" }, { key: "at", label: "Date", render: (r) => dateTime(r.at) }]} rows={p.history as Row[]} /> : <EmptyState message="No history recorded." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------ notifications ------------------------------ */

function NotificationsSection() {
  const [notifications, setNotifications] = useState<Row[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/notifications?limit=50", { cache: "no-store" }).then((r) => r.json()).then((d) => setNotifications(Array.isArray(d.notifications) ? d.notifications : [])).catch(() => setError("Unable to load notifications."));
  }, []);
  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }
  return <>
    <PageHeader title="Notifications" subtitle="Partnership, hiring, recommendation and placement updates." action={<button onClick={markAll} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px] text-[#267653]">Mark all as read</button>} />
    <Panel title={`Notifications (${notifications.length})`}>
      {error && <ErrorBox message={error} />}
      {notifications.length ? <div className="divide-y divide-[#F1F4F2]">{notifications.map((n, i) => <div key={i} className="py-3">
        <p className="text-[13px] font-medium text-[#34455D]">{String(n.title || "Notification")} {!n.read && <span className="ml-1 rounded bg-[#EAF5F0] px-1.5 py-0.5 text-[10px] text-[#267653]">New</span>}</p>
        <p className="text-[12px] text-[#71817A]">{String(n.message || "")}</p>
        <p className="text-[10px] text-[#93A09A]">{dateTime(n.createdAt)}</p>
      </div>)}</div> : <EmptyState message="You have no notifications yet." />}
    </Panel>
  </>;
}

/* --------------------------------- settings -------------------------------- */

function SettingsSection() {
  const [team, setTeam] = useState<Row | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/counseling/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => setTeam(d.team || null)).catch(() => undefined);
  }, []);
  return <>
    <PageHeader title="Organization settings" subtitle="Manage your counseling organization profile and preferences." />
    <div className="space-y-5">
      <Panel title="Organization profile">
        {team ? <div className="grid gap-3 text-[13px] sm:grid-cols-2">
          <Info label="Name" value={String(team.name || "—")} />
          <Info label="Admin" value={String((team.adminId as Row)?.fullName || "—")} />
          <Info label="Description" value={String(team.description || "—")} />
          <Info label="Status" value={<StatusBadge value={team.status} />} />
        </div> : <div className="py-8 text-center text-sm text-[#8A98A5]">Loading…</div>}
      </Panel>
      <FormCard title="Edit organization settings" endpoint="/api/counseling/settings" method="PATCH" fields={[
        { name: "name", label: "Organization name" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "address", label: "Address" },
        { name: "contactEmail", label: "Contact email" },
        { name: "contactPhone", label: "Contact phone" },
        { name: "website", label: "Website" },
        { name: "logo", label: "Logo URL" },
        { name: "teamPreferences", label: "Team preferences", type: "textarea" },
        { name: "notificationPreferences", label: "Notification preferences", type: "textarea" },
      ]} onDone={() => { setMessage("Settings saved."); }} />
      {message && <p className="text-xs text-[#267653]">{message}</p>}
    </div>
  </>;
}
