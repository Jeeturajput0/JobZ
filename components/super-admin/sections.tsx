"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OverviewSection } from "./overview";
import { DataTable, EmptyState, ErrorBox, FilterBar, PageHeader, Pagination, Panel, StatusBadge, useResource, type Column } from "./ui";

type Row = Record<string, unknown>;

export function SuperAdminSection({ path }: { path: string[] }) {
  const [slug, sub] = path;
  if (!slug || slug === "dashboard") return <OverviewSection />;
  if (slug === "companies") return <CompaniesRouter sub={sub} />;
  if (slug === "company-members") return <SimpleList title="Company team members" subtitle="All HR and recruiter accounts across companies." endpoint="/api/platform/company-members" dataKey="members" columns={memberColumns} />;
  if (slug === "counseling") return <CounselingRouter sub={sub} />;
  if (slug === "counseling-members") return <SimpleList title="Counseling team members" subtitle="All counselors across counseling organizations." endpoint="/api/platform/counseling-members" dataKey="members" columns={memberColumns} />;
  if (slug === "counseling-overview") return <CounselingOverview />;
  if (slug === "seekers") return <SeekersRouter sub={sub} />;
  if (slug === "jobs") return <JobsRouter sub={sub} />;
  if (slug === "applications") return <ApplicationsRouter sub={sub} />;
  if (slug === "partnerships") return <PartnershipsRouter sub={sub} />;
  if (slug === "placements") return <PlacementsRouter sub={sub} />;
  if (slug === "admins") return <AdminsSection />;
  if (slug === "roles") return <RolesSection />;
  if (slug === "settings") return <SettingsSection />;
  if (slug === "activity") return <ActivitySection />;
  return <><PageHeader title="Not found" subtitle="This Super Admin section does not exist." /><EmptyState message="Choose a section from the sidebar." /></>;
}

const isId = (value?: string) => Boolean(value && /^[a-f\d]{24}$/i.test(value));
const date = (v: unknown) => v ? new Date(String(v)).toLocaleDateString() : "—";

const memberColumns: Column<Row>[] = [
  { key: "user", label: "Member", render: (r) => String((r.userId as Row)?.fullName || "—") },
  { key: "email", label: "Email", render: (r) => String((r.userId as Row)?.email || "—") },
  { key: "org", label: "Organization", render: (r) => String((r.companyId as Row)?.name || (r.teamId as Row)?.name || "—") },
  { key: "title", label: "Role" },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
];

/* --------------------------------- generic -------------------------------- */

type Field = { name: string; label: string; type?: "text" | "textarea" | "select" | "password" | "number"; options?: { value: string; label: string }[]; required?: boolean; placeholder?: string };

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

type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };

function SimpleList({ title, subtitle, endpoint, dataKey, columns, filters, action, refreshKey }: {
  title: string; subtitle?: string; endpoint: string; dataKey: string; columns: Column<Row>[];
  filters?: FilterDef[]; action?: ReactNode; refreshKey?: number;
}) {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const params = new URLSearchParams({ ...values, search });
  const res = useResource<Row>(`${endpoint}?${params.toString()}`, dataKey, [search, values, refreshKey]);
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} action={action} />
      <Panel title={`${title} (${res.total})`}>
        <FilterBar search={search} onSearch={setSearch} filters={filters} values={values} onFilter={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
        {res.error && <ErrorBox message={res.error} />}
        {res.loading ? <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div> :
          res.data.length ? <DataTable columns={columns} rows={res.data} /> : <EmptyState message={`No ${title.toLowerCase()} found.`} />}
        <Pagination page={res.page} total={res.total} onChange={res.setPage} />
      </Panel>
    </>
  );
}

function DetailPanel({ endpoint, children }: { endpoint: string; children: (data: Record<string, unknown>) => ReactNode }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!active) return;
        if (!ok) throw new Error(d.message || "Unable to load details.");
        setData(d);
      })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);

  if (error) return <ErrorBox message={error} />;
  if (loading || !data) return <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div>;
  return <>{children(data)}</>;
}

/* -------------------------------- companies -------------------------------- */

function CompaniesRouter({ sub }: { sub?: string }) {
  if (sub === "add") return <AddCompany />;
  if (sub === "verification") return <CompanyVerification />;
  if (isId(sub)) return <CompanyDetail id={sub!} />;
  return <SimpleList title="Companies" subtitle="All registered companies and their verification state." endpoint="/api/platform/companies" dataKey="companies" columns={companyColumns} filters={[{ key: "verificationStatus", label: "Verification", options: [{ value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }] }, { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] }]} action={<Link href="/admin/companies/add" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Add company</Link>} />;
}

const companyColumns: Column<Row>[] = [
  { key: "name", label: "Company", render: (r) => <Link className="font-medium text-[#267653]" href={`/admin/companies/${String(r._id)}`}>{String(r.name || "—")}</Link> },
  { key: "email", label: "Email", render: (r) => String((r.ownerId as Row)?.email || "—") },
  { key: "contact", label: "Contact person", render: (r) => String((r.ownerId as Row)?.fullName || "—") },
  { key: "industry", label: "Industry", render: (r) => String(r.industry || (r.employerProfileId as Row)?.industry || "—") },
  { key: "location", label: "Location", render: (r) => String((r.employerProfileId as Row)?.location || "—") },
  { key: "verificationStatus", label: "Verification", render: (r) => <StatusBadge value={r.verificationStatus} /> },
  { key: "status", label: "Account", render: (r) => <StatusBadge value={r.status} /> },
  { key: "createdAt", label: "Registered", render: (r) => date(r.createdAt) },
];

function AddCompany() {
  return <>
    <PageHeader title="Add company" subtitle="Creates the company, its owner account and a pending verification record." />
    <FormCard title="Company details" endpoint="/api/platform/companies" fields={[
      { name: "name", label: "Company name", required: true },
      { name: "contactPerson", label: "Contact person", required: true },
      { name: "email", label: "Owner email", type: "text", required: true },
      { name: "password", label: "Temporary password", type: "password", required: true },
      { name: "phone", label: "Phone" },
      { name: "industry", label: "Industry" },
      { name: "location", label: "Location" },
      { name: "website", label: "Website" },
      { name: "description", label: "Description", type: "textarea" },
    ]} />
  </>;
}

function CompanyVerification() {
  return <SimpleList title="Company verification" subtitle="Review companies awaiting verification." endpoint="/api/platform/companies?verificationStatus=pending" dataKey="companies" columns={companyColumns} />;
}

function CompanyDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Company details" subtitle="Profile, jobs, applications, team and partnerships." action={<Link href="/admin/companies" className="text-xs text-[#267653]">← Back to companies</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/platform/companies/${id}`}>
      {(d) => {
        const c = (d.company as Row) || {};
        return <div className="space-y-5">
          <Panel title="Profile" action={<Link href={`/api/platform/companies/${id}`} target="_blank" className="text-xs text-[#267653]">Raw data</Link>}>
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Name" value={String(c.name || "—")} />
              <Info label="Industry" value={String(c.industry || (c.employerProfileId as Row)?.industry || "—")} />
              <Info label="Location" value={String((c.employerProfileId as Row)?.location || "—")} />
              <Info label="Owner" value={String((c.ownerId as Row)?.fullName || "—")} />
              <Info label="Email" value={String((c.ownerId as Row)?.email || "—")} />
              <Info label="Verification" value={<StatusBadge value={c.verificationStatus} />} />
              <Info label="Account status" value={<StatusBadge value={c.status} />} />
              <Info label="Registered" value={date(c.createdAt)} />
            </div>
          </Panel>
          <Panel title="Verify company">
            <FormCard title="Verification decision" subtitle="Approve, reject or reset verification. A reason is recorded in the history." endpoint={`/api/platform/companies/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this company's verification status?" fields={[
              { name: "verificationStatus", label: "Verification status", type: "select", options: [{ value: "verified", label: "Approve (verified)" }, { value: "rejected", label: "Reject" }, { value: "pending", label: "Reset to pending" }], required: true },
              { name: "reason", label: "Reason / note", type: "textarea" },
              { name: "status", label: "Account status", type: "select", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] },
            ]} />
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[#52627A]">Verification history</p>
              {((d.verificationHistory as Row[]) || []).length ? <DataTable columns={[{ key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "note", label: "Note" }, { key: "at", label: "Date", render: (r) => date(r.at) }]} rows={d.verificationHistory as Row[]} /> : <EmptyState message="No verification decisions recorded yet." />}
            </div>
          </Panel>
          <Panel title="Jobs ({(d.jobs as Row[]).length})">{ (d.jobs as Row[]).length ? <DataTable columns={[{ key: "title", label: "Title" }, { key: "location", label: "Location" }, { key: "approvalStatus", label: "Approval", render: (r) => <StatusBadge value={r.approvalStatus} /> }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.jobs as Row[]} /> : <EmptyState message="No jobs posted by this company." />}</Panel>
          <Panel title="Applications ({(d.applications as Row[]).length})">{ (d.applications as Row[]).length ? <DataTable columns={[{ key: "jobId", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") }, { key: "jobSeekerId", label: "Candidate", render: (r) => String((r.jobSeekerId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) }]} rows={d.applications as Row[]} /> : <EmptyState message="No applications for this company." />}</Panel>
          <Panel title="Team members">{(d.members as Row[]).length ? <DataTable columns={memberColumns} rows={d.members as Row[]} /> : <EmptyState message="No team members added." />}</Panel>
          <Panel title="Counseling partnerships">{(d.partnerships as Row[]).length ? <DataTable columns={[{ key: "team", label: "Organization", render: (r) => String((r.counselingTeamId as Row)?.name || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.partnerships as Row[]} /> : <EmptyState message="No counseling partnerships." />}</Panel>
          <Panel title="Placement records">{(d.placements as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.placements as Row[]} /> : <EmptyState message="No placement records for this company." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div><p className="text-[11px] uppercase tracking-wide text-[#93A09A]">{label}</p><div className="mt-0.5 text-[13px] text-[#34455D]">{value}</div></div>;
}

/* ---------------------------- counseling orgs ------------------------------ */

function CounselingRouter({ sub }: { sub?: string }) {
  if (sub === "add") return <AddCounseling />;
  if (isId(sub)) return <CounselingDetail id={sub!} />;
  return <SimpleList title="Counseling organizations" subtitle="All counseling and recruitment partner organizations." endpoint="/api/platform/counseling-teams" dataKey="teams" columns={counselingColumns} filters={[{ key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] }]} action={<Link href="/admin/counseling/add" className="rounded-lg bg-[#3FA47B] px-3 py-2 text-[13px] font-semibold text-white">Add organization</Link>} />;
}

const counselingColumns: Column<Row>[] = [
  { key: "name", label: "Organization", render: (r) => <Link className="font-medium text-[#267653]" href={`/admin/counseling/${String(r._id)}`}>{String(r.name || "—")}</Link> },
  { key: "admin", label: "Admin", render: (r) => String((r.adminId as Row)?.fullName || "—") },
  { key: "email", label: "Email", render: (r) => String((r.adminId as Row)?.email || "—") },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "createdAt", label: "Created", render: (r) => date(r.createdAt) },
];

function AddCounseling() {
  return <>
    <PageHeader title="Add counseling organization" subtitle="Creates the organization and its admin account." />
    <FormCard title="Organization details" endpoint="/api/platform/counseling-teams" fields={[
      { name: "name", label: "Organization name", required: true },
      { name: "adminName", label: "Admin full name", required: true },
      { name: "adminEmail", label: "Admin email", required: true },
      { name: "password", label: "Temporary password", type: "password", required: true },
      { name: "phone", label: "Phone" },
      { name: "description", label: "Description", type: "textarea" },
    ]} />
  </>;
}

function CounselingDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Organization details" subtitle="Profile, team, candidates, partnerships and placements." action={<Link href="/admin/counseling" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/platform/counseling-teams/${id}`}>
      {(d) => {
        const t = (d.team as Row) || {};
        return <div className="space-y-5">
          <Panel title="Profile">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Name" value={String(t.name || "—")} />
              <Info label="Admin" value={String((t.adminId as Row)?.fullName || "—")} />
              <Info label="Email" value={String((t.adminId as Row)?.email || "—")} />
              <Info label="Status" value={<StatusBadge value={t.status} />} />
              <Info label="Created" value={date(t.createdAt)} />
            </div>
          </Panel>
          <Panel title="Activate / suspend / edit">
            <FormCard title="Update organization" endpoint={`/api/platform/counseling-teams/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} fields={[
              { name: "name", label: "Name" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] },
            ]} />
          </Panel>
          <Panel title="Team members">{(d.members as Row[]).length ? <DataTable columns={memberColumns} rows={d.members as Row[]} /> : <EmptyState message="No team members added." />}</Panel>
          <Panel title="Assigned candidates">{(d.candidates as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "workflowStatus", label: "Workflow", render: (r) => <StatusBadge value={r.workflowStatus} /> }]} rows={d.candidates as Row[]} /> : <EmptyState message="No candidates assigned." />}</Panel>
          <Panel title="Company partnerships">{(d.partnerships as Row[]).length ? <DataTable columns={[{ key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.partnerships as Row[]} /> : <EmptyState message="No partnerships." />}</Panel>
          <Panel title="Candidate recommendations">{(d.recommendations as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No recommendations yet." />}</Panel>
          <Panel title="Hiring requests">{(d.hiringRequests as Row[]).length ? <DataTable columns={[{ key: "jobTitle", label: "Role" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.hiringRequests as Row[]} /> : <EmptyState message="No hiring requests." />}</Panel>
          <Panel title="Placement records">{(d.placements as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.placements as Row[]} /> : <EmptyState message="No placement records." />}</Panel>
          <Panel title="Activity history">{(d.activity as Row[]).length ? <DataTable columns={[{ key: "action", label: "Action" }, { key: "description", label: "Details" }, { key: "createdAt", label: "Date", render: (r) => date(r.createdAt) }]} rows={d.activity as Row[]} /> : <EmptyState message="No activity recorded." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

function CounselingOverview() {
  return <><PageHeader title="Counseling overview" subtitle="Organization-level counseling statistics." /><Metrics endpoint="/api/counseling/analytics" /></>;
}

function Metrics({ endpoint }: { endpoint: string }) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (active) setStats(d.analytics || d.summary || d.stats || null); })
      .catch(() => { if (active) setError("Unable to load analytics."); });
    return () => { active = false; };
  }, [endpoint]);
  if (error) return <ErrorBox message={error} />;
  if (!stats) return <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div>;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(stats).filter(([, v]) => typeof v === "number").map(([k, v]) => <Panel key={k} title={k.replace(/([A-Z])/g, " $1")}><p className="text-2xl font-semibold text-[#267653]">{String(v)}</p></Panel>)}</div>;
}

/* -------------------------------- job seekers ----------------------------- */

function SeekersRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <SeekerDetail id={sub!} />;
  if (sub === "verification") return <SimpleList title="Candidate verification" subtitle="Verification requests submitted by job seekers." endpoint="/api/verification/reviews" dataKey="requests" columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "category", label: "Category" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "submittedAt", label: "Submitted", render: (r) => date(r.submittedAt) }]} />;
  return <SimpleList title="Job seekers" subtitle="All candidates, profiles and application counts." endpoint="/api/platform/seekers" dataKey="seekers" columns={seekerColumns} filters={[{ key: "verification", label: "Verification", options: [{ value: "verified", label: "Verified" }, { value: "pendingReview", label: "Pending" }, { value: "notSubmitted", label: "Not submitted" }] }, { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] }]} />;
}

const seekerColumns: Column<Row>[] = [
  { key: "fullName", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/admin/seekers/${String(r._id)}`}>{String(r.fullName || "—")}</Link> },
  { key: "email", label: "Email" },
  { key: "skills", label: "Skills", render: (r) => String(((r.profile as Row)?.skills as string[] || []).slice(0, 4).join(", ")) },
  { key: "experience", label: "Experience", render: (r) => `${((r.profile as Row)?.experience as Row[] || []).length} entries` },
  { key: "completion", label: "Profile", render: (r) => `${completionScore(r.profile as Row)}%` },
  { key: "verification", label: "Verification", render: (r) => <StatusBadge value={(r.profile as Row)?.verificationStatus} /> },
  { key: "applications", label: "Applications" },
  { key: "createdAt", label: "Registered", render: (r) => date(r.createdAt) },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
];

function completionScore(profile?: Row | null): number {
  if (!profile) return 0;
  const basic = [profile.headline, profile.summary, profile.location, profile.resumeUrl].filter(Boolean).length;
  return Math.round((Math.min(5, basic) / 5) * 15 + ((profile.education as Row[])?.length ? 15 : 0) + (((profile.skills as string[])?.length || 0) >= 3 ? 15 : 0) + (profile.resumeUrl ? 15 : 0) + (((profile.projects as Row[])?.length) ? 10 : 0) + (((profile.achievements as Row[])?.length) ? 5 : 0) + (profile.careerGoals ? 10 : 0) + (((profile.jobPreferences as Row)?.roles as string[])?.length ? 10 : 0) + ((((profile.experience as Row[])?.length) || ((profile.projects as Row[])?.length)) ? 5 : 0));
}

function SeekerDetail({ id }: { id: string }) {
  return <>
    <PageHeader title="Candidate details" subtitle="Profile, applications, assessments and verification." action={<Link href="/admin/seekers" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel endpoint={`/api/platform/seekers/${id}`}>
      {(d) => {
        const u = (d.user as Row) || {};
        const c = (d.completion as Row) || {};
        const p = (d.profile as Row) || {};
        return <div className="space-y-5">
          <Panel title="Profile">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Name" value={String(u.fullName || "—")} />
              <Info label="Email" value={String(u.email || "—")} />
              <Info label="Profile completion" value={`${c.percentage ?? 0}%`} />
              <Info label="Job readiness" value={<StatusBadge value={c.jobReadiness} />} />
              <Info label="Verification" value={<StatusBadge value={c.verificationStatus} />} />
              <Info label="Account status" value={<StatusBadge value={u.status} />} />
              <Info label="Registered" value={date(u.createdAt)} />
            </div>
          </Panel>
          <Panel title="Skills, education & experience">
            <p className="text-[13px] text-[#34455D]"><b>Skills:</b> {String((p.skills as string[] || []).join(", ") || "—")}</p>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Education</p>{(p.education as Row[] || []).length ? <DataTable columns={[{ key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }, { key: "year", label: "Year" }]} rows={p.education as Row[]} /> : <EmptyState message="No education added." />}</div>
            <div className="mt-3"><p className="text-xs font-semibold text-[#52627A]">Experience</p>{(p.experience as Row[] || []).length ? <DataTable columns={[{ key: "company", label: "Company" }, { key: "position", label: "Position" }, { key: "duration", label: "Duration" }]} rows={p.experience as Row[]} /> : <EmptyState message="No experience added." />}</div>
          </Panel>
          <Panel title="Applications">{(d.applications as Row[]).length ? <DataTable columns={[{ key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) }]} rows={d.applications as Row[]} /> : <EmptyState message="No applications yet." />}</Panel>
          <Panel title="Saved jobs">{(d.savedJobs as Row[]).length ? <DataTable columns={[{ key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") }]} rows={d.savedJobs as Row[]} /> : <EmptyState message="No saved jobs." />}</Panel>
          <Panel title="Assessments">{(d.assessments as Row[]).length ? <DataTable columns={[{ key: "percentage", label: "Score", render: (r) => `${r.percentage}%` }, { key: "strengths", label: "Strengths" }, { key: "completedAt", label: "Date", render: (r) => date(r.completedAt) }]} rows={d.assessments as Row[]} /> : <EmptyState message="No assessment records." />}</Panel>
          <Panel title="Verification history">{(d.verifications as Row[]).length ? <DataTable columns={[{ key: "category", label: "Category" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "submittedAt", label: "Submitted", render: (r) => date(r.submittedAt) }]} rows={d.verifications as Row[]} /> : <EmptyState message="No verification requests." />}</Panel>
          <Panel title="Counseling association">{(d.counselingAssociations as Row[]).length ? <DataTable columns={[{ key: "team", label: "Organization", render: (r) => String((r.teamId as Row)?.name || "—") }, { key: "workflowStatus", label: "Workflow", render: (r) => <StatusBadge value={r.workflowStatus} /> }]} rows={d.counselingAssociations as Row[]} /> : <EmptyState message="No counseling association." />}</Panel>
          <Panel title="Recommendations">{(d.recommendations as Row[]).length ? <DataTable columns={[{ key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No recommendations." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ---------------------------------- jobs ----------------------------------- */

function JobsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <JobDetail id={sub!} />;
  const approval = sub === "pending" ? "pending" : sub === "rejected" ? "rejected" : undefined;
  const status = sub === "active" ? "active" : undefined;
  const title = sub === "pending" ? "Pending jobs" : sub === "active" ? "Active jobs" : sub === "rejected" ? "Rejected jobs" : "All jobs";
  return <SimpleList title={title} subtitle="Review and manage job approvals." endpoint={`/api/platform/jobs${approval ? `?approvalStatus=${approval}` : status ? `?status=${status}` : ""}`} dataKey="jobs" columns={jobColumns} filters={[{ key: "approvalStatus", label: "Approval", options: [{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }] }, { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "closed", label: "Closed" }] }]} />;
}

const jobColumns: Column<Row>[] = [
  { key: "title", label: "Job title", render: (r) => <Link className="font-medium text-[#267653]" href={`/admin/jobs/${String(r._id)}`}>{String(r.title || "—")}</Link> },
  { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.companyName || "—") },
  { key: "location", label: "Location", render: (r) => String(r.location || "—") },
  { key: "jobType", label: "Type" },
  { key: "approvalStatus", label: "Approval", render: (r) => <StatusBadge value={r.approvalStatus} /> },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "applications", label: "Applications" },
  { key: "createdAt", label: "Posted", render: (r) => date(r.createdAt) },
];

function JobDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Job details" subtitle="Review approval and status." action={<Link href="/admin/jobs" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/platform/jobs/${id}`}>
      {(d) => {
        const j = (d.job as Row) || {};
        return <div className="space-y-5">
          <Panel title="Job">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Title" value={String(j.title || "—")} />
              <Info label="Company" value={String((j.companyId as Row)?.companyName || "—")} />
              <Info label="Location" value={String(j.location || "—")} />
              <Info label="Type" value={String(j.jobType || "—")} />
              <Info label="Approval" value={<StatusBadge value={j.approvalStatus} />} />
              <Info label="Status" value={<StatusBadge value={j.status} />} />
            </div>
          </Panel>
          <FormCard title="Approval decision" endpoint={`/api/platform/jobs/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this job's approval or status?" fields={[
            { name: "approvalStatus", label: "Approval status", type: "select", options: [{ value: "approved", label: "Approve" }, { value: "rejected", label: "Reject" }, { value: "pending", label: "Pending" }] },
            { name: "status", label: "Job status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "closed", label: "Closed" }, { value: "draft", label: "Draft" }] },
            { name: "reason", label: "Reason", type: "textarea" },
          ]} />
          <Panel title="Applications">{(d.applications as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.jobSeekerId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.applications as Row[]} /> : <EmptyState message="No applications for this job." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------- applications ------------------------------ */

function ApplicationsRouter({ sub }: { sub?: string }) {
  if (sub === "overview") return <><PageHeader title="Application overview" /><ApplicationOverview /></>;
  return <SimpleList title="Applications" subtitle="Central application pipeline across all companies." endpoint="/api/platform/applications" dataKey="applications" columns={applicationColumns} filters={[{ key: "source", label: "Source", options: [{ value: "direct", label: "Direct application" }, { value: "recommendation", label: "Counseling referral" }] }, { key: "status", label: "Status", options: [{ value: "applied", label: "Applied" }, { value: "shortlisted", label: "Shortlisted" }, { value: "hired", label: "Hired" }, { value: "rejected", label: "Rejected" }] }]} />;
}

function ApplicationOverview() {
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/platform/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (active) setPayload(d.analytics || null); })
      .catch(() => { if (active) setError("Unable to load application analytics."); });
    return () => { active = false; };
  }, []);
  if (error) return <ErrorBox message={error} />;
  if (!payload) return <div className="py-10 text-center text-sm text-[#8A98A5]">Loading…</div>;
  const stats = Object.entries(payload).filter(([key, value]) => /application|shortlist|interview|hire|reject/i.test(key) && typeof value === "number");
  const byStatus = payload.applicationsByStatus as Row[] | undefined;
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([key, value]) => <Panel key={key} title={key.replace(/([A-Z])/g, " $1")}><p className="text-2xl font-semibold text-[#267653]">{String(value)}</p></Panel>)}
    </div>
    <Panel title="Applications by status">
      {byStatus?.length ? <DataTable columns={[{ key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }, { key: "count", label: "Count" }]} rows={byStatus} /> : <EmptyState message="No application data available." />}
    </Panel>
  </div>;
}

const applicationColumns: Column<Row>[] = [
  { key: "candidate", label: "Candidate", render: (r) => String((r.jobSeekerId as Row)?.fullName || "—") },
  { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
  { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
  { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source === "recommendation" ? "Counseling Referral" : "Direct Application"} /> },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "appliedAt", label: "Applied", render: (r) => date(r.appliedAt) },
];

/* ------------------------------- partnerships ------------------------------ */

function PartnershipsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <PartnershipDetail id={sub!} />;
  const status = sub === "pending" ? "pending" : sub === "active" ? "accepted" : undefined;
  const title = sub === "pending" ? "Pending partnership requests" : sub === "active" ? "Active partnerships" : "Partnerships";
  return <>
    <SimpleList title={title} subtitle="Company ↔ Counseling organization relationships." endpoint={`/api/platform/partnerships${status ? `?status=${status}` : ""}`} dataKey="partnerships" columns={partnershipColumns} filters={[{ key: "status", label: "Status", options: [{ value: "pending", label: "Pending" }, { value: "accepted", label: "Accepted" }, { value: "rejected", label: "Rejected" }, { value: "suspended", label: "Suspended" }, { value: "terminated", label: "Terminated" }] }]} />
    <div className="mt-5"><FormCard title="Create partnership" subtitle="Records a real company–counseling relationship with pending status." endpoint="/api/platform/partnerships" fields={[
      { name: "companyId", label: "Company ID", required: true },
      { name: "counselingTeamId", label: "Counseling organization ID", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ]} /></div>
  </>;
}

const partnershipColumns: Column<Row>[] = [
  { key: "company", label: "Company", render: (r) => <Link className="font-medium text-[#267653]" href={`/admin/partnerships/${String(r._id)}`}>{String((r.companyId as Row)?.name || "—")}</Link> },
  { key: "team", label: "Counseling organization", render: (r) => String((r.counselingTeamId as Row)?.name || "—") },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "requestedBy", label: "Requested by", render: (r) => String((r.requestedBy as Row)?.fullName || "—") },
  { key: "createdAt", label: "Created", render: (r) => date(r.createdAt) },
];

function PartnershipDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Partnership details" action={<Link href="/admin/partnerships" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel key={refresh} endpoint={`/api/platform/partnerships/${id}`}>
      {(d) => {
        const p = (d.partnership as Row) || {};
        return <div className="space-y-5">
          <Panel title="Partnership">
            <div className="grid gap-3 text-[13px] sm:grid-cols-2">
              <Info label="Company" value={String((p.companyId as Row)?.name || "—")} />
              <Info label="Organization" value={String((p.counselingTeamId as Row)?.name || "—")} />
              <Info label="Status" value={<StatusBadge value={p.status} />} />
              <Info label="Created" value={date(p.createdAt)} />
              <Info label="Notes" value={String(p.notes || "—")} />
            </div>
          </Panel>
          <FormCard title="Update partnership" endpoint={`/api/platform/partnerships/${id}`} method="PATCH" onDone={() => setRefresh((r) => r + 1)} confirm="Update this partnership status?" fields={[
            { name: "status", label: "Status", type: "select", options: [{ value: "accepted", label: "Accepted" }, { value: "rejected", label: "Rejected" }, { value: "suspended", label: "Suspended" }, { value: "terminated", label: "Terminated" }, { value: "pending", label: "Pending" }] },
            { name: "note", label: "Note", type: "textarea" },
          ]} />
          <Panel title="Recommended candidates">{(d.recommendations as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.recommendations as Row[]} /> : <EmptyState message="No candidates recommended through this partnership." />}</Panel>
          <Panel title="Hiring requests">{(d.hiringRequests as Row[]).length ? <DataTable columns={[{ key: "jobTitle", label: "Role" }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.hiringRequests as Row[]} /> : <EmptyState message="No hiring requests." />}</Panel>
          <Panel title="Recruitment records (placements)">{(d.placements as Row[]).length ? <DataTable columns={[{ key: "candidate", label: "Candidate", render: (r) => String((r.candidateId as Row)?.fullName || "—") }, { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }]} rows={d.placements as Row[]} /> : <EmptyState message="No placements recorded for this partnership." />}</Panel>
          <Panel title="Partnership history">{(d.activity as Row[]).length ? <DataTable columns={[{ key: "action", label: "Action" }, { key: "description", label: "Details" }, { key: "createdAt", label: "Date", render: (r) => date(r.createdAt) }]} rows={d.activity as Row[]} /> : <EmptyState message="No history recorded." />}</Panel>
        </div>;
      }}
    </DetailPanel>
  </>;
}

/* -------------------------------- placements ------------------------------ */

function PlacementsRouter({ sub }: { sub?: string }) {
  if (isId(sub)) return <PlacementDetail id={sub!} />;
  return <SimpleList title="Placement records" subtitle="Confirmed hiring outcomes. No revenue is inferred from these records." endpoint="/api/platform/placements" dataKey="placements" columns={placementColumns} filters={[{ key: "source", label: "Source", options: [{ value: "direct", label: "Direct" }, { value: "counselingReferral", label: "Counseling referral" }, { value: "other", label: "Other" }] }, { key: "status", label: "Status", options: [{ value: "recorded", label: "Recorded" }, { value: "confirmed", label: "Confirmed" }, { value: "cancelled", label: "Cancelled" }] }]} />;
}

const placementColumns: Column<Row>[] = [
  { key: "candidate", label: "Candidate", render: (r) => <Link className="font-medium text-[#267653]" href={`/admin/placements/${String(r._id)}`}>{String((r.candidateId as Row)?.fullName || "—")}</Link> },
  { key: "company", label: "Company", render: (r) => String((r.companyId as Row)?.name || "—") },
  { key: "job", label: "Job", render: (r) => String((r.jobId as Row)?.title || "—") },
  { key: "org", label: "Counseling org", render: (r) => String((r.counselingTeamId as Row)?.name || "—") },
  { key: "counselor", label: "Counselor", render: (r) => String((r.counselorId as Row)?.fullName || "—") },
  { key: "source", label: "Source", render: (r) => <StatusBadge value={r.source} /> },
  { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  { key: "joiningDate", label: "Joining", render: (r) => r.joiningDate ? date(r.joiningDate) : "—" },
];

function PlacementDetail({ id }: { id: string }) {
  return <>
    <PageHeader title="Placement details" action={<Link href="/admin/placements" className="text-xs text-[#267653]">← Back</Link>} />
    <DetailPanel endpoint={`/api/platform/placements/${id}`}>
      {(d) => {
        const p = (d.placement as Row) || {};
        return <Panel title="Placement record">
          <div className="grid gap-3 text-[13px] sm:grid-cols-2">
            <Info label="Candidate" value={String((p.candidateId as Row)?.fullName || "—")} />
            <Info label="Company" value={String((p.companyId as Row)?.name || "—")} />
            <Info label="Job" value={String((p.jobId as Row)?.title || "—")} />
            <Info label="Counseling organization" value={String((p.counselingTeamId as Row)?.name || "—")} />
            <Info label="Counselor" value={String((p.counselorId as Row)?.fullName || "—")} />
            <Info label="Source" value={<StatusBadge value={p.source} />} />
            <Info label="Status" value={<StatusBadge value={p.status} />} />
            <Info label="Joining date" value={p.joiningDate ? date(p.joiningDate) : "—"} />
            <Info label="Notes" value={String(p.notes || "—")} />
          </div>
        </Panel>;
      }}
    </DetailPanel>
  </>;
}

/* ------------------------------ team & access ------------------------------ */

function AdminsSection() {
  const [refresh, setRefresh] = useState(0);
  return <>
    <PageHeader title="Super Admin members" subtitle="Platform administrators and their access." />
    <SimpleList title="Members" endpoint="/api/platform/admins" dataKey="admins" refreshKey={refresh} columns={[
      { key: "fullName", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role", render: () => <StatusBadge value="Super Admin" /> },
      { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { key: "createdAt", label: "Added", render: (r) => date(r.createdAt) },
    ]} />
    <div className="mt-5 space-y-5">
      <FormCard title="Add super admin" endpoint="/api/platform/admins" fields={[
        { name: "fullName", label: "Full name", required: true },
        { name: "email", label: "Email", required: true },
        { name: "password", label: "Temporary password", type: "password", required: true },
      ]} onDone={() => setRefresh((r) => r + 1)} />
      <AdminAccessForm onDone={() => setRefresh((r) => r + 1)} />
    </div>
  </>;
}

function AdminAccessForm({ onDone }: { onDone: () => void }) {
  const [id, setId] = useState("");
  const [status, setStatus] = useState("active");
  const [permissions, setPermissions] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("Update this super admin's access?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/platform/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, directPermissions: permissions.split(",").map((p) => p.trim()).filter(Boolean) }),
      });
      const result = await response.json();
      setMessage(result.message || (response.ok ? "Access updated." : "Unable to update access."));
      if (response.ok) onDone();
    } catch { setMessage("Could not connect to JobZ."); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#172B25]">Update member access</h2>
      <p className="mt-0.5 text-xs text-[#8A98A5]">You cannot deactivate or suspend your own account.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Admin user ID" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]">
          <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
        </select>
        <input value={permissions} onChange={(e) => setPermissions(e.target.value)} placeholder="Permission keys (comma separated)" className="rounded-lg border border-[#E5ECE8] px-3 py-2 text-[13px]" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-[#3FA47B] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Update access"}</button>
        {message && <span className="text-xs text-[#267653]">{message}</span>}
      </div>
    </form>
  );
}

function RolesSection() {
  return <>
    <PageHeader title="Roles & permissions" subtitle="Dynamic platform roles and the permission catalogue." />
    <SimpleList title="Roles" endpoint="/api/platform/roles" dataKey="roles" columns={[
      { key: "name", label: "Role" },
      { key: "scope", label: "Scope" },
      { key: "permissions", label: "Permissions", render: (r) => `${(r.permissions as string[] || []).length}` },
      { key: "isSystem", label: "System", render: (r) => (r.isSystem ? "Yes" : "No") },
    ]} />
    <div className="mt-5"><SimpleList title="Permission catalogue" endpoint="/api/platform/permissions" dataKey="permissions" columns={[
      { key: "key", label: "Key" },
      { key: "label", label: "Label" },
      { key: "group", label: "Group" },
      { key: "sensitive", label: "Sensitive", render: (r) => (r.sensitive ? "Yes" : "No") },
    ]} /></div>
  </>;
}

/* --------------------------------- settings -------------------------------- */

function SettingsSection() {
  return <>
    <PageHeader title="Platform settings" subtitle="Configuration stored in MongoDB and applied at runtime." />
    <FormCard title="Edit settings" subtitle="Enter a JSON object. Supported keys: matching.weights, profileCompletion.weights, ats.version, ats.aiAssisted, platform.registrationEnabled." endpoint="/api/platform/settings" method="PATCH" fields={[
      { name: "settings", label: "Settings JSON", type: "textarea", required: true, placeholder: '{"matching.weights":{"skills":40}}' },
    ]} />
    <div className="mt-5"><Metrics endpoint="/api/platform/analytics" /></div>
  </>;
}

/* --------------------------------- activity -------------------------------- */

function ActivitySection() {
  return <SimpleList title="Platform activity logs" subtitle="Actual administrative actions recorded by the system." endpoint="/api/platform/activity" dataKey="logs" columns={[
    { key: "actor", label: "User", render: (r) => String(r.actorRole || "system") },
    { key: "action", label: "Action", render: (r) => <StatusBadge value={r.action} /> },
    { key: "entity", label: "Entity", render: (r) => `${String(r.entity || "")}${r.entityId ? ` · ${String(r.entityId).slice(0, 8)}` : ""}` },
    { key: "description", label: "Details" },
    { key: "createdAt", label: "Date", render: (r) => new Date(String(r.createdAt)).toLocaleString() },
  ]} />;
}
