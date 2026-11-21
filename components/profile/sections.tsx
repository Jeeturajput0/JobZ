"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Clock3, FileText, MapPin, Pencil, Sparkles, Users } from "lucide-react";
import {
  ProfileSection, ApplicationsSection, SavedJobsSection, InterviewsSection,
  ProgressSection, CounselingSection, NotificationsSection, SettingsSection,
} from "@/components/job-seeker/sections";
import { EmptyState, ErrorBox, Panel, StatusBadge } from "@/components/super-admin/ui";

type Row = Record<string, unknown>;

export function ProfileSectionView({ section }: { section: string }) {
  if (section === "edit") return <ProfileSection />;
  if (section === "resume") return <ProfileResumeSection />;
  if (section === "applications") return <ApplicationsSection />;
  if (section === "saved-jobs") return <SavedJobsSection />;
  if (section === "interviews") return <InterviewsSection />;
  if (section === "career-progress") return <ProgressSection />;
  if (section === "counseling") return <CounselingSection />;
  if (section === "notifications") return <NotificationsSection />;
  if (section === "settings") return <SettingsSection />;
  return <ProfileOverviewSection />;
}

/* ------------------------------ profile overview --------------------------- */

function ProfileOverviewSection() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Row>({});
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [busyJob, setBusyJob] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/job-seeker/overview", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/candidate/profile", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([overview, prof]) => {
      if (!active) return;
      if (!overview.success) throw new Error(overview.message || "Unable to load profile.");
      setData(overview);
      setProfile({ ...(prof.profile || {}), fullName: prof.user?.fullName || (prof.profile as Row)?.fullName });
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load profile."); });
    return () => { active = false; };
  }, [revision]);

  async function saveJob(id: string) {
    setBusyJob(id);
    await fetch("/api/saved-jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: id }) });
    setBusyJob("");
  }

  if (error) return <ErrorBox message={error} />;
  if (!data) return <div className="space-y-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl border border-[#E4EBE7] bg-white" />)}</div>;

  const s = (data.stats || {}) as Record<string, number>;
  const c = (data.completion || {}) as Row;
  const completion = Number(s.profileCompletion) || 0;
  const recommended = (data.recommendedJobs as Row[]) || [];
  const recent = (data.recentApplications as Row[]) || [];

  return <div className="space-y-6">
    {/* Profile header */}
    <section className="overflow-hidden rounded-2xl border border-[#E4EBE7] bg-white shadow-[0_8px_30px_rgba(20,50,35,.04)]">
      <div className="h-24 bg-[radial-gradient(ellipse_at_top_left,_#D9F2E5,_transparent_62%),linear-gradient(120deg,#F3F8F5,#E7F2EC)]" />
      <div className="px-6 pb-6 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10 grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-[#EAF5F0] text-2xl font-bold text-[#16895C] shadow-sm">
              {String(profile.profileImage || "") ? <img src={String(profile.profileImage)} alt="Profile" className="size-full object-cover" /> : String(profile.fullName || "J")[0]}
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="truncate text-xl font-bold text-[#172B25] sm:text-2xl">{String(profile.fullName || "Job Seeker")}</h2>
              <p className="text-sm text-[#52635B]">{String(profile.headline || "Complete your professional headline")}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#68776F]">
                <span className="inline-flex items-center gap-1"><MapPin size={13} /> {String(profile.location || "Location not set")}</span>
                <span>{String(profile.email || (data.user as Row)?.email || "")}</span>
                {Boolean(profile.phone) && <span>{String(profile.phone)}</span>}
              </p>
            </div>
          </div>
          <Link href="/profile/edit" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#16895C] px-4 text-sm font-semibold text-white hover:bg-[#11764D]">
            <Pencil size={15} /> Complete Profile
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {(profile.skills as string[] || []).length ? (profile.skills as string[]).slice(0, 10).map((skill) => <span key={skill} className="rounded-full bg-[#F1F7F4] px-3 py-1 text-xs font-medium text-[#267653]">{skill}</span>) : <span className="text-xs text-[#8A98A5]">No skills added yet.</span>}
        </div>
      </div>
    </section>

    {/* Completion + stats */}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-[0_8px_30px_rgba(20,50,35,.04)]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#172B25]">Profile completion</h3>
          <span className="text-sm font-bold text-[#16895C]">{completion}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EDF3EF]"><div className="h-full rounded-full bg-[#16895C] transition-all" style={{ width: `${completion}%` }} /></div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8A98A5]">Missing sections</p>
        <p className="mt-1 text-sm text-[#52635B]">{((c.missingSections as string[]) || []).join(", ") || "Nothing — your profile is complete."}</p>
        <Link href="/profile/edit" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#16895C]">Complete your profile <ArrowUpRight size={14} /></Link>
      </section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Applications", value: s.totalApplications, icon: BriefcaseBusiness },
          { label: "Under Review", value: s.underReview, icon: Clock3 },
          { label: "Interviews", value: s.interviewsScheduled, icon: Users },
          { label: "Selected", value: s.shortlisted, icon: CheckCircle2 },
          { label: "Saved Jobs", value: s.savedJobs, icon: FileText },
          { label: "Assessments", value: (s as Record<string, number>).assessments, icon: Sparkles },
        ].map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="rounded-2xl border border-[#E4EBE7] bg-white p-4 shadow-[0_8px_30px_rgba(20,50,35,.04)]">
            <div className="flex items-center justify-between"><p className="text-[11px] font-medium text-[#68776F]">{stat.label}</p><Icon size={15} className="text-[#16895C]" /></div>
            <p className="mt-2 text-2xl font-bold text-[#172B25]">{Number(stat.value) || 0}</p>
          </div>;
        })}
      </section>
    </div>

    {/* Recent applications */}
    <section className="rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-[0_8px_30px_rgba(20,50,35,.04)] sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#172B25]">Recent Applications</h3>
        <Link href="/profile/applications" className="inline-flex items-center gap-1 text-sm font-semibold text-[#16895C]">View all <ArrowUpRight size={14} /></Link>
      </div>
      {recent.length ? <div className="divide-y divide-[#EAF0EC]">{recent.map((a) => <div key={String(a.id)} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#F1F7F4] text-[#16895C]"><BriefcaseBusiness size={17} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#172B25]">{String(a.job)}</p><p className="text-xs text-[#68776F]">{String(a.company)} · {new Date(String(a.appliedAt)).toLocaleDateString()}</p></div></div>
        <StatusBadge value={a.status} />
      </div>)}</div> : <EmptyState message="You have not applied to any jobs yet." />}
    </section>

    {/* Recommended jobs */}
    <section className="rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-[0_8px_30px_rgba(20,50,35,.04)] sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#172B25]">Recommended Jobs</h3>
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-[#16895C]">View all <ArrowUpRight size={14} /></Link>
      </div>
      {recommended.length ? <div className="grid gap-3 sm:grid-cols-2">{recommended.map((job) => <div key={String(job.id)} className="rounded-xl border border-[#E4EBE7] bg-[#FCFDFC] p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><Link href={`/jobs/${String(job.id)}`} className="truncate text-sm font-semibold text-[#172B25] hover:text-[#16895C]">{String(job.title)}</Link><p className="text-xs text-[#68776F]">{String(job.company)} · {String(job.location)}</p></div>
          <span className="shrink-0 rounded-full bg-[#EAF5F0] px-2 py-1 text-[10px] font-semibold text-[#16895C]">{String(job.score)}% match</span>
        </div>
        <p className="mt-2 text-xs text-[#68776F]">{String(job.experience || "")} · {String(job.jobType || "")} · {job.minSalary || job.maxSalary ? `${job.minSalary || ""}–${job.maxSalary || ""}` : "Salary not disclosed"}</p>
        <div className="mt-3 flex flex-wrap gap-1">{(job.matchedSkills as string[] || []).slice(0, 4).map((skill) => <span key={skill} className="rounded bg-[#F1F7F4] px-2 py-0.5 text-[10px] text-[#267653]">{skill}</span>)}</div>
        <div className="mt-3 flex gap-2"><Link href={`/jobs/${String(job.id)}`} className="inline-flex min-h-8 items-center rounded-lg bg-[#16895C] px-3 text-xs font-semibold text-white">Apply Now</Link><button disabled={busyJob === String(job.id)} onClick={() => saveJob(String(job.id))} className="inline-flex min-h-8 items-center rounded-lg border border-[#D9E4DD] px-3 text-xs font-semibold text-[#267653] disabled:opacity-50">Save Job</button></div>
      </div>)}</div> : <EmptyState message="No recommended jobs available yet. Add your skills and preferences to improve matches." />}
    </section>
  </div>;
}

/* ------------------------------ resume section ----------------------------- */

function ProfileResumeSection() {
  const [documents, setDocuments] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [preferredId, setPreferredId] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidate/documents", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/candidate/profile", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([d, p]) => {
      setDocuments(Array.isArray(d.documents) ? d.documents.filter((x: Row) => x.type === "resume") : []);
      setPreferredId(String((p.profile as Row)?.preferredResumeId || ""));
    }).catch(() => undefined);
  }, [revision]);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) { setMessage("File must be 5 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const response = await fetch("/api/candidate/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, type: "resume", category: "profile", dataUrl: String(reader.result), size: file.size }),
      });
      const result = await response.json();
      setMessage(result.message || (response.ok ? "Resume uploaded." : "Upload failed."));
      if (response.ok) setRevision((r) => r + 1);
    };
    reader.readAsDataURL(file);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this resume?")) return;
    const response = await fetch(`/api/candidate/documents/${id}`, { method: "DELETE" });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Resume deleted." : "Delete failed."));
    if (response.ok) setRevision((r) => r + 1);
  }

  async function prefer(id: string) {
    const response = await fetch("/api/candidate/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferredResumeId: id }),
    });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Preferred resume updated." : "Unable to update."));
    if (response.ok) setRevision((r) => r + 1);
  }

  return <div className="space-y-5">
    {message && <div className="rounded-lg bg-[#EAF5F0] px-4 py-2 text-xs text-[#16895C]">{message}</div>}
    <Panel title="Upload a resume" subtitle="PDF, DOC, DOCX, PNG or JPG up to 5 MB. Stored privately.">
      <input type="file" accept=".pdf,.doc,.docx,image/png,image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} className="block w-full max-w-sm text-xs" />
    </Panel>
    <Panel title={`Your resumes (${documents.length})`}>
      {documents.length ? <div className="divide-y divide-[#EAF0EC]">{documents.map((d) => <div key={String(d._id)} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p className="text-sm font-semibold text-[#172B25]">{String(d.name)} {String(d._id) === preferredId && <span className="ml-1 rounded bg-[#EAF5F0] px-2 py-0.5 text-[10px] text-[#16895C]">Preferred</span>}</p><p className="text-xs text-[#68776F]">{String(d.mimeType)} · uploaded {new Date(String(d.createdAt)).toLocaleDateString()}</p></div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/candidate/documents/${String(d._id)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#D9E4DD] px-3 py-1.5 text-xs font-semibold text-[#16895C]">View</a>
          <a href={`/api/candidate/documents/${String(d._id)}`} download={String(d.name)} className="rounded-lg border border-[#D9E4DD] px-3 py-1.5 text-xs font-semibold text-[#16895C]">Download</a>
          {String(d._id) !== preferredId && <button onClick={() => prefer(String(d._id))} className="rounded-lg border border-[#D9E4DD] px-3 py-1.5 text-xs font-semibold text-[#16895C]">Make preferred</button>}
          <button onClick={() => remove(String(d._id))} className="rounded-lg border border-[#F3CFC5] px-3 py-1.5 text-xs font-semibold text-[#B25238]">Delete</button>
        </div>
      </div>)}</div> : <EmptyState message="No resume uploaded yet." />}
    </Panel>
  </div>;
}
