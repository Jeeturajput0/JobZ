"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useJobZ } from "@/components/provider";

type AdminJob = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription?: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  jobType: string;
  workMode: string;
  experienceLevel: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  location: string;
  benefits: string[];
  applicationDeadline?: string | null;
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";

  isFeatured: boolean;
  createdAt?: string;
  companyId?: { _id: string; companyName?: string } | string | null;
  employerId?: { _id: string; fullName?: string } | string | null;
};

type JobForm = {
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string;
  jobType: string;
  workMode: string;
  experienceLevel: string;
  minSalary: string;
  maxSalary: string;
  location: string;
  benefits: string;
  applicationDeadline: string;

  isFeatured: boolean;
};

type Pagination = { page: number; totalPages: number; total: number };
type ModalMode = "view" | "edit" | "delete" | null;

const emptyForm: JobForm = {
  title: "",
  slug: "",
  category: "",
  shortDescription: "",
  description: "",
  responsibilities: "",
  requirements: "",
  skills: "",
  jobType: "full-time",
  workMode: "onsite",
  experienceLevel: "",
  minSalary: "",
  maxSalary: "",
  location: "",
  benefits: "",
  applicationDeadline: "",


  isFeatured: false,
};

function listToText(values?: string[]) {
  return values?.join("\n") ?? "";
}

function toForm(job: AdminJob): JobForm {
  return {
    title: job.title,
    slug: job.slug,
    category: job.category,
    shortDescription: job.shortDescription || job.description.slice(0, 160),
    description: job.description,
    responsibilities: listToText(job.responsibilities),
    requirements: listToText(job.requirements),
    skills: listToText(job.skills),
    jobType: job.jobType,
    workMode: job.workMode,
    experienceLevel: job.experienceLevel,
    minSalary: job.minSalary == null ? "" : String(job.minSalary),
    maxSalary: job.maxSalary == null ? "" : String(job.maxSalary),
    location: job.location,
    benefits: listToText(job.benefits),
    applicationDeadline: job.applicationDeadline?.slice(0, 10) ?? "",


    isFeatured: job.isFeatured,
  };
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function companyName(job: AdminJob) {
  return typeof job.companyId === "object" && job.companyId
    ? job.companyId.companyName || "Company name unavailable"
    : "Company profile unavailable";
}

function displayEnum(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSalary(job: AdminJob) {
  const format = (value: number) => `$${value.toLocaleString("en-US")}`;
  if (job.minSalary != null && job.maxSalary != null) {
    return `${format(job.minSalary)} – ${format(job.maxSalary)}`;
  }
  if (job.minSalary != null) return `From ${format(job.minSalary)}`;
  if (job.maxSalary != null) return `Up to ${format(job.maxSalary)}`;
  return "Not specified";
}

export function AdminJobsManager() {
  const { toast } = useJobZ();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approvalSaving, setApprovalSaving] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/jobs?page=${page}&limit=50`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load jobs.");
      setJobs(result.jobs as AdminJob[]);
      setPagination(result.pagination as Pagination);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  function openModal(job: AdminJob, mode: Exclude<ModalMode, null>) {
    setSelectedJob(job);
    setActionError("");
    if (mode === "edit") setForm(toForm(job));
    setModal(mode);
  }

  function updateForm<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedJob) return;
    setSaving(true);
    setActionError("");

    const payload = {
      ...form,
      responsibilities: textToList(form.responsibilities),
      requirements: textToList(form.requirements),
      skills: textToList(form.skills),
      benefits: textToList(form.benefits),
      minSalary: form.minSalary === "" ? null : Number(form.minSalary),
      maxSalary: form.maxSalary === "" ? null : Number(form.maxSalary),
      applicationDeadline: form.applicationDeadline || null,
    };

    try {
      const response = await fetch(`/api/jobs/${selectedJob._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update job.");

      const updated = result.job as AdminJob;
      setJobs((current) => current.map((job) => job._id === updated._id ? updated : job));
      setSelectedJob(updated);
      setModal(null);
      toast("Job updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update job.";
      setActionError(message);
      toast(`Error: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob() {
    if (!selectedJob) return;
    setDeleting(true);
    setActionError("");
    try {
      const response = await fetch(`/api/jobs/${selectedJob._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not deactivate job.");

      setJobs((current) => current.filter((job) => job._id !== selectedJob._id));
      setModal(null);
      toast("Job removed from the active listings.");
      if (jobs.length === 1 && page > 1) setPage((current) => current - 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not deactivate job.";
      setActionError(message);
      toast(`Error: ${message}`);
    } finally {
      setDeleting(false);
    }
  }

  async function updateApproval(job: AdminJob, approvalStatus: AdminJob["approvalStatus"]) {
    setApprovalSaving(job._id);
    try {
      const response = await fetch(`/api/jobs/${job._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update review status.");
      const updated = result.job as AdminJob;
      setJobs((current) => current.map((item) => item._id === updated._id ? { ...item, ...updated } : item));
      toast(`Job ${approvalStatus}.`);
    } catch (error) {
      toast(`Error: ${error instanceof Error ? error.message : "Could not update review status."}`);
    } finally {
      setApprovalSaving(null);
    }
  }

  function closeModal() {
    if (saving || deleting) return;
    setModal(null);
    setActionError("");
  }

  return (
    <section className="panel [background:#fff] [border:1px_solid_#eaedf1] [border-radius:.75rem] [border-color:#E5ECE8] [box-shadow:0_1px_2px_rgb(24_45_77_/_3%)] table-panel [padding:17px] [margin-top:13px] max-[700px]:[padding:13px] [border-color:#E5ECE8] [border-radius:.75rem] [background:#fff] [box-shadow:0_1px_2px_rgb(24_45_77_/_3%)] [background-color:#fff] [&_a]:[color:#328A66] admin-jobs-panel">
      <div className="panel-head [&_select]:[width:112px] [&_select]:[padding:7px] [&_select]:[border:1px_solid_#e7ebf0] [&_select]:[border-radius:6px] [&_select]:[background:white] [&_select]:[color:#536177] [&_select]:[font-size:14px] [&_select]:[letter-spacing:0] [display:flex] [justify-content:space-between] [align-items:center] [&>div]:[display:grid] [&>div]:[gap:5px] [&_b]:[font-size:21px] [&_b]:[color:#354761] [&_small]:[font-size:14px] [&_small]:[color:#929daa] [.table-panel>_&]:[margin-bottom:17px] [&_b]:[line-height:1.35] [&_small]:[line-height:1.5]">
        <div>
          <b>All job listings</b>
          <small>{pagination.total} listings</small>
        </div>
        <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc] btn-sm [padding:8px_13px] [font-size:.75rem] [min-height:38px]" onClick={() => void loadJobs()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loadError && <p className="admin-jobs-error [color:#a34149!important] [background:#fff4f4] [padding:10px_12px] [border-radius:7px] [font-size:12px]" role="alert">{loadError}</p>}
      {loading ? (
        <p role="status" className="text-sm leading-6 text-[#71817A]">Loading job listings…</p>
      ) : !jobs.length ? (
        <div className="empty-state [padding:55px_20px] [text-align:center] [border:1px_dashed_#dfe4ea] [border-radius:.75rem] [color:#7c899b] [&>svg]:[color:#3FA47B] [&_h3]:[color:#34455d] [&_h3]:[margin:12px_0_5px] [&_p]:[font-size:16px] [&_p]:[margin-bottom:17px] [&_p]:[line-height:1.65] [&_h3]:[font-size:21px] [&_h3]:[line-height:1.35] [.admin-jobs-panel_&]:[margin-top:12px] [background:#fbfcfe]">No job listings found.</div>
      ) : (
        <div className="scroll-table [overflow:auto]">
          <div className="admin-job-row [display:grid] [grid-template-columns:minmax(150px,1.5fr)_minmax(130px,1fr)_minmax(100px,.8fr)_minmax(95px,.8fr)_minmax(120px,1fr)_minmax(90px,.7fr)_130px_112px] [gap:10px] [align-items:center] [min-width:1080px] [padding:12px_8px] [border-bottom:1px_solid_#f0f2f5] [color:#657286] [font-size:11px] admin-job-head [font-size:9px] [letter-spacing:.6px] [color:#99a2ae]">
            <span>JOB TITLE</span><span>COMPANY</span><span>CATEGORY</span>
            <span>TYPE</span><span>LOCATION</span><span>STATUS</span><span>REVIEW</span><span>ACTIONS</span>
          </div>
          {jobs.map((job) => (
            <div className="admin-job-row [display:grid] [grid-template-columns:minmax(150px,1.5fr)_minmax(130px,1fr)_minmax(100px,.8fr)_minmax(95px,.8fr)_minmax(120px,1fr)_minmax(90px,.7fr)_130px_112px] [gap:10px] [align-items:center] [min-width:1080px] [padding:12px_8px] [border-bottom:1px_solid_#f0f2f5] [color:#657286] [font-size:11px]" key={job._id}>
              <span className="admin-job-title [font-weight:600] [color:#394d68]">{job.title}</span>
              <span>{companyName(job)}</span>
              <span>{job.category}</span>
              <span>{displayEnum(job.jobType)}</span>
              <span>{job.location}</span>
              <span><i className="status-pill [font-style:normal] [background:#eff7f2] [color:#328460] [border-radius:10px] [padding:4px_8px] [font-size:14px] [line-height:1.35]">{displayEnum(job.status)}</i></span>
              <span><select aria-label={`Review status for ${job.title}`} value={job.approvalStatus || "pending"} disabled={approvalSaving === job._id} onChange={(event) => void updateApproval(job, event.target.value as AdminJob["approvalStatus"])} className="[max-width:130px] [border:1px_solid_#dce7e1] [border-radius:6px] [background:#fff] [padding:6px] [color:#34455d]">{["pending", "approved", "rejected"].map((status) => <option key={status} value={status}>{displayEnum(status)}</option>)}</select></span>
              <span className="admin-job-actions [display:flex] [align-items:center] [gap:2px]">
                <button className="icon-btn [display:grid] [place-items:center] [background:transparent] [border:0] [color:#5c6a7e] [padding:8px] [border-radius:8px] [&_:hover]:[color:#267653] admin-job-action [width:32px] [height:32px] [color:#328A66] [&_:hover]:[background:#EAF5F0] [&_:hover]:[color:#267653]" title="View job" aria-label={`View ${job.title}`} onClick={() => openModal(job, "view")}>
                  <Eye size={17} />
                </button>
                <button className="icon-btn [display:grid] [place-items:center] [background:transparent] [border:0] [color:#5c6a7e] [padding:8px] [border-radius:8px] [&_:hover]:[color:#267653] admin-job-action [width:32px] [height:32px] [color:#328A66] [&_:hover]:[background:#EAF5F0] [&_:hover]:[color:#267653]" title="Edit job" aria-label={`Edit ${job.title}`} onClick={() => openModal(job, "edit")}>
                  <Pencil size={16} />
                </button>
                <button className="icon-btn [display:grid] [place-items:center] [background:transparent] [border:0] [color:#5c6a7e] [padding:8px] [border-radius:8px] [&_:hover]:[color:#267653] admin-job-action [width:32px] [height:32px] [color:#328A66] [&_:hover]:[background:#EAF5F0] [&_:hover]:[color:#267653] admin-job-delete [&_:hover]:[color:#a34149] [&_:hover]:[background:#fff1f1]" title="Delete job" aria-label={`Delete ${job.title}`} onClick={() => openModal(job, "delete")}>
                  <Trash2 size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="admin-job-pagination [display:flex] [align-items:center] [justify-content:flex-end] [gap:12px] [padding-top:14px] [color:#758197] [font-size:11px] max-[700px]:[justify-content:center]">
          <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc] btn-sm [padding:8px_13px] [font-size:.75rem] [min-height:38px]" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc] btn-sm [padding:8px_13px] [font-size:.75rem] [min-height:38px]" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      )}

      {modal && selectedJob && (
        <div className="modal-backdrop [position:fixed] [inset:0] [background:#10213a88] [z-index:20] [display:grid] [place-items:center] [padding:20px]" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          {modal === "view" && (
            <section className="modal [position:relative] [background:#fff] [border-radius:14px] [padding:30px] [width:min(475px,100%)] [box-shadow:0_25px_90px_#101d3933] [&_h2]:[font-size:var(--type-card-heading)] [&_h2]:[color:#263b5a] [&_h2]:[margin:3px_0_8px] [&>p]:[color:#7c8999] [&>p]:[font-size:16px] [&>p]:[line-height:1.65] [&_textarea]:[width:100%] [&_textarea]:[height:95px] [&_textarea]:[resize:vertical] [&_textarea]:[padding:11px] [&_textarea]:[border:1px_solid_#e5e9ee] [&_textarea]:[border-radius:7px] [&_textarea]:[margin:10px_0] [&_h2]:[line-height:1.3] [background-color:#fff] [border-color:#E5ECE8] admin-job-modal [width:min(780px,100%)] [max-height:90vh] [overflow-y:auto] max-[700px]:[padding:22px_16px]" role="dialog" aria-modal="true" aria-labelledby="admin-job-view-title">
              <button className="modal-close [position:absolute] [right:15px] [top:15px] [background:white] [border:0] [color:#8793a1]" onClick={closeModal} aria-label="Close"><span aria-hidden="true">×</span></button>
              <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">JOB LISTING · READ ONLY</div>
              <h2 id="admin-job-view-title" className="text-2xl font-semibold tracking-tight text-[#172B25]">{selectedJob.title}</h2>
              <dl className="admin-job-details [display:grid] [grid-template-columns:1fr_1fr] [gap:12px_20px] [margin:20px_0_0] [&>div]:[min-width:0] [&_dt]:[font-size:10px] [&_dt]:[font-weight:600] [&_dt]:[color:#8792a2] [&_dt]:[margin-bottom:5px] [&_dd]:[font-size:13px] [&_dd]:[color:#334862] [&_dd]:[margin:0] [&_dd]:[overflow-wrap:anywhere] [&_dd]:[white-space:pre-wrap] max-[700px]:[grid-template-columns:1fr]">
                <div><dt>Company</dt><dd>{companyName(selectedJob)}</dd></div>
                <div><dt>Category</dt><dd>{selectedJob.category}</dd></div>
                <div><dt>Job type</dt><dd>{displayEnum(selectedJob.jobType)}</dd></div>
                <div><dt>Work mode</dt><dd>{displayEnum(selectedJob.workMode)}</dd></div>
                <div><dt>Location</dt><dd>{selectedJob.location}</dd></div>
                <div><dt>Salary</dt><dd>{formatSalary(selectedJob)}</dd></div>
                <div><dt>Experience level</dt><dd>{selectedJob.experienceLevel}</dd></div>
                <div><dt>Status</dt><dd>{displayEnum(selectedJob.status)}</dd></div>
                <div className="admin-job-detail-full [grid-column:1/-1] max-[700px]:[grid-column:auto]"><dt>Description</dt><dd>{selectedJob.description}</dd></div>
                <div className="admin-job-detail-full [grid-column:1/-1] max-[700px]:[grid-column:auto]"><dt>Required skills</dt><dd>{selectedJob.skills.length ? selectedJob.skills.join(", ") : "No skills listed"}</dd></div>
                <div className="admin-job-detail-full [grid-column:1/-1] max-[700px]:[grid-column:auto]"><dt>Responsibilities</dt><dd>{selectedJob.responsibilities.length ? selectedJob.responsibilities.join(" · ") : "Not specified"}</dd></div>
                <div className="admin-job-detail-full [grid-column:1/-1] max-[700px]:[grid-column:auto]"><dt>Requirements</dt><dd>{selectedJob.requirements.length ? selectedJob.requirements.join(" · ") : "Not specified"}</dd></div>
                <div className="admin-job-detail-full [grid-column:1/-1] max-[700px]:[grid-column:auto]"><dt>Benefits</dt><dd>{selectedJob.benefits.length ? selectedJob.benefits.join(" · ") : "Not specified"}</dd></div>
                <div><dt>Application deadline</dt><dd>{selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : "None"}</dd></div>
                <div><dt>Featured</dt><dd>{selectedJob.isFeatured ? "Yes" : "No"}</dd></div>
              </dl>
            </section>
          )}

          {modal === "edit" && (
            <section className="modal [position:relative] [background:#fff] [border-radius:14px] [padding:30px] [width:min(475px,100%)] [box-shadow:0_25px_90px_#101d3933] [&_h2]:[font-size:var(--type-card-heading)] [&_h2]:[color:#263b5a] [&_h2]:[margin:3px_0_8px] [&>p]:[color:#7c8999] [&>p]:[font-size:16px] [&>p]:[line-height:1.65] [&_textarea]:[width:100%] [&_textarea]:[height:95px] [&_textarea]:[resize:vertical] [&_textarea]:[padding:11px] [&_textarea]:[border:1px_solid_#e5e9ee] [&_textarea]:[border-radius:7px] [&_textarea]:[margin:10px_0] [&_h2]:[line-height:1.3] [background-color:#fff] [border-color:#E5ECE8] admin-job-modal [width:min(780px,100%)] [max-height:90vh] [overflow-y:auto] max-[700px]:[padding:22px_16px]" role="dialog" aria-modal="true" aria-labelledby="admin-job-edit-title">
              <button className="modal-close [position:absolute] [right:15px] [top:15px] [background:white] [border:0] [color:#8793a1]" onClick={closeModal} aria-label="Close"><span aria-hidden="true">×</span></button>
              <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">ADMIN JOB MANAGEMENT</div>
              <h2 id="admin-job-edit-title" className="text-2xl font-semibold tracking-tight text-[#172B25]">Edit job</h2>
              <p className="text-sm leading-6 text-[#71817A]">Company and employer ownership remain linked to their existing profiles.</p>
              {actionError && <p className="admin-jobs-error [color:#a34149!important] [background:#fff4f4] [padding:10px_12px] [border-radius:7px] [font-size:12px]" role="alert">{actionError}</p>}
              <form className="form-grid [&_label]:[display:grid] [&_label]:[gap:8px] [&_label]:[font-size:14px] [&_label]:[color:#42536a] [&_label]:[font-weight:600] [&_label]:[margin:15px_0] [display:grid] [grid-template-columns:1fr_1fr] [gap:0_15px] [margin-top:10px] max-[700px]:[grid-template-columns:1fr] [&_label]:[line-height:1.45] admin-job-edit-form [max-height:64vh] [overflow-y:auto] [padding-right:5px] max-[700px]:[max-height:62vh]" onSubmit={saveJob}>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Job title<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Slug<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Company<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" readOnly value={companyName(selectedJob)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Category<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required value={form.category} onChange={(event) => updateForm("category", event.target.value)} /></label>
                <label className="full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">Short description<textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required rows={3} maxLength={160} value={form.shortDescription} onChange={(event) => updateForm("shortDescription", event.target.value)} /><small>{form.shortDescription.length}/160 characters</small></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Job type<select className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" value={form.jobType} onChange={(event) => updateForm("jobType", event.target.value)}>{[["full-time", "Full-time"], ["part-time", "Part-time"], ["internship", "Internship"], ["contract", "Contract"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Work mode<select className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" value={form.workMode} onChange={(event) => updateForm("workMode", event.target.value)}>{[["onsite", "On-site"], ["remote", "Remote"], ["hybrid", "Hybrid"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Location<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required value={form.location} onChange={(event) => updateForm("location", event.target.value)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Experience level<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required value={form.experienceLevel} onChange={(event) => updateForm("experienceLevel", event.target.value)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Minimum salary<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" type="number" min="0" step="1" value={form.minSalary} onChange={(event) => updateForm("minSalary", event.target.value)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Maximum salary<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" type="number" min="0" step="1" value={form.maxSalary} onChange={(event) => updateForm("maxSalary", event.target.value)} /></label>
                <label className="grid gap-2 text-sm font-medium text-[#172B25]">Application deadline<input className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" type="date" value={form.applicationDeadline} onChange={(event) => updateForm("applicationDeadline", event.target.value)} /></label>


                <label className="full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">Description<textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" required rows={5} value={form.description} onChange={(event) => updateForm("description", event.target.value)} /></label>
                <label className="full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">Required skills <small>One item per line</small><textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" rows={3} value={form.skills} onChange={(event) => updateForm("skills", event.target.value)} /></label>
                <label className="full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">Responsibilities <small>One item per line</small><textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" rows={3} value={form.responsibilities} onChange={(event) => updateForm("responsibilities", event.target.value)} /></label>
                <label className="full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">Requirements <small>One item per line</small><textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" rows={3} value={form.requirements} onChange={(event) => updateForm("requirements", event.target.value)} /></label>
                <label className="full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">Benefits <small>One item per line</small><textarea className="input [height:42px] [width:100%] [border:1px_solid_#e2e7ed] [border-radius:.5rem] [padding:0_11px] [color:#34445a] [background:white] [font-size:14px] [font-weight:400] [&_::placeholder]:[color:#a0a9b6] [&_:focus]:[border-color:#3FA47B] [&_:focus]:[outline:3px_solid_#e8ecff] [.form-grid_&]:[font-size:.875rem] [.add-category_&]:[max-width:400px] max-[700px]:[.add-category_&]:[max-width:none] max-[700px]:[transition:border-color_180ms_ease-out,_box-shadow_180ms_ease-out] [.admin-job-edit-form_&]:[font-size:.875rem] [.admin-job-edit-form_&]:[height:auto] [.admin-job-edit-form_&]:[min-height:78px] [.admin-job-edit-form_&]:[padding:10px] [.admin-job-edit-form_&]:[resize:vertical] [min-height:44px] [border-color:#E5ECE8] [body_.form-grid_&]:[font-size:14px] [body_.admin-job-edit-form_&]:[font-size:14px] [&_:focus]:[outline-color:#3FA47B] [&_:focus]:[box-shadow:0_0_0_3px_rgb(63_164_123_/_14%)]" rows={3} value={form.benefits} onChange={(event) => updateForm("benefits", event.target.value)} /></label>
                <label className="admin-job-featured [display:flex!important] [align-items:center] [gap:8px!important] [&_input]:[accent-color:#3FA47B]"><input type="checkbox" checked={form.isFeatured} onChange={(event) => updateForm("isFeatured", event.target.checked)}  className="w-full rounded-lg border border-[#E5ECE8] bg-white px-3 py-2 text-sm text-[#172B25] placeholder:text-[#71817A] focus:border-[#3FA47B] focus:outline-none focus:ring-2 focus:ring-[#3FA47B]/20"/> Featured job</label>
                <div className="form-footer [display:flex] [justify-content:flex-end] [gap:9px] [padding-top:16px] [border-top:1px_solid_#eff1f4] max-[700px]:[flex-wrap:wrap] full-field [grid-column:1/-1] max-[700px]:[grid-column:auto]">
                  <button type="button" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                </div>
              </form>
            </section>
          )}

          {modal === "delete" && (
            <section className="modal [position:relative] [background:#fff] [border-radius:14px] [padding:30px] [width:min(475px,100%)] [box-shadow:0_25px_90px_#101d3933] [&_h2]:[font-size:var(--type-card-heading)] [&_h2]:[color:#263b5a] [&_h2]:[margin:3px_0_8px] [&>p]:[color:#7c8999] [&>p]:[font-size:16px] [&>p]:[line-height:1.65] [&_textarea]:[width:100%] [&_textarea]:[height:95px] [&_textarea]:[resize:vertical] [&_textarea]:[padding:11px] [&_textarea]:[border:1px_solid_#e5e9ee] [&_textarea]:[border-radius:7px] [&_textarea]:[margin:10px_0] [&_h2]:[line-height:1.3] [background-color:#fff] [border-color:#E5ECE8] admin-job-confirm [width:min(460px,100%)]" role="alertdialog" aria-modal="true" aria-labelledby="admin-job-delete-title">
              <button className="modal-close [position:absolute] [right:15px] [top:15px] [background:white] [border:0] [color:#8793a1]" onClick={closeModal} aria-label="Close"><span aria-hidden="true">×</span></button>
              <div className="kicker [font-size:.75rem] [letter-spacing:.08em] [font-weight:600] [color:#71817A] [margin-bottom:12px] [.bottom-cta_&]:[color:#b6c4dd] [.bottom-cta_&]:[font-size:9px] [.dash-welcome_&]:[font-size:8px] [.dash-welcome_&]:[margin-bottom:8px] [line-height:1.45] [body_.bottom-cta_&]:[font-size:14px] [body_.bottom-cta_&]:[line-height:1.5] [.home-section_&]:[margin-bottom:11px] [.home-section_&]:[color:#328A66] [.home-section_&]:[font-size:10px] [.home-section_&]:[letter-spacing:.13em]">CONFIRM DEACTIVATION</div>
              <h2 id="admin-job-delete-title" className="text-2xl font-semibold tracking-tight text-[#172B25]">Remove this job?</h2>
              <p className="text-sm leading-6 text-[#71817A]"><strong>{selectedJob.title}</strong> will be deactivated and removed from this listings table.</p>
              {actionError && <p className="admin-jobs-error [color:#a34149!important] [background:#fff4f4] [padding:10px_12px] [border-radius:7px] [font-size:12px]" role="alert">{actionError}</p>}
              <div className="form-footer [display:flex] [justify-content:flex-end] [gap:9px] [padding-top:16px] [border-top:1px_solid_#eff1f4] max-[700px]:[flex-wrap:wrap]">
                <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-outline [background:#fff] [border-color:#dfe5ed] [color:#33445d] [&_:hover]:[border-color:#93a4c3] [&_:hover]:[background:#f9fafc]" onClick={closeModal} disabled={deleting}>Cancel</button>
                <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [border:1px_solid_transparent] [border-radius:.5rem] [padding:10px_16px] [font-weight:600] [font-size:.875rem] [transition:all_.18s_ease] [white-space:nowrap] [.searchbar>_&]:[height:46px] [.bottom-cta_&]:[z-index:1] [.summary-card_&]:[margin-top:17px] max-[700px]:[.searchbar>_&]:[width:100%] max-[700px]:[.bottom-cta_&]:[margin-top:20px] max-[700px]:[&_:first-child]:[flex:1] max-[700px]:[.summary-card>_&]:[grid-column:1/-1] max-[700px]:[.dash-welcome>_&]:[padding:9px] max-[700px]:[.dash-welcome>_&]:[font-size:10px] max-[700px]:[.company-profile-hero>_&]:[margin-left:72px] max-[700px]:[.company-role>_&]:[padding:8px] max-[700px]:[.company-role>_&]:[font-size:9px] [body_.company-role>_&]:[font-size:15px] max-[700px]:[body_.dash-welcome>_&]:[font-size:15px] [transition-duration:180ms] [transition-timing-function:ease-out] [&_:active]:[transform:scale(.985)] motion-reduce:[transition-duration:.01ms!important] [min-height:42px] [body_.auth-form_&]:[font-size:14px] [body_.auth-form_&]:[min-height:46px] [body_.contact-form_&]:[font-size:14px] [body_.contact-form_&]:[min-height:46px] [body_.form-card_&]:[font-size:14px] [body_.form-card_&]:[min-height:46px] max-[420px]:[.searchbar_>_&]:[width:100%] [.home-hero_.searchbar_>_&]:[min-height:52px] [.home-hero_.searchbar_>_&]:[padding-inline:21px] [.home-hero_.searchbar_>_&]:[border-radius:11px] [.home-hero_.searchbar_>_&]:[font-size:14px] [.home-cta_&]:[position:relative] [.home-cta_&]:[z-index:2] [.home-cta_&]:[min-height:48px] [.home-cta_&]:[border-radius:10px] [.home-cta_&]:[font-size:13px] max-[600px]:[.home-hero_.searchbar_>_&]:[min-height:48px] max-[600px]:[.home-cta_&]:[width:100%] max-[600px]:[.home-cta_&]:[margin:0] btn-primary [background:#3FA47B] [color:#fff] [box-shadow:0_3px_9px_rgb(38_118_83_/_18%)] [&_:hover]:[background:#328A66] [&_:hover]:[transform:translateY(-1px)]" onClick={() => void deleteJob()} disabled={deleting}>{deleting ? "Removing…" : "Confirm delete"}</button>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
