"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useJobZ } from "@/components/provider";

type AdminJob = {
  _id: string;
  title: string;
  slug: string;
  category: string;
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
  approvalStatus: string;
  isFeatured: boolean;
  createdAt?: string;
  companyId?: { _id: string; companyName?: string } | string | null;
  employerId?: { _id: string; fullName?: string } | string | null;
};

type JobForm = {
  title: string;
  slug: string;
  category: string;
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
  status: string;
  approvalStatus: string;
  isFeatured: boolean;
};

type Pagination = { page: number; totalPages: number; total: number };
type ModalMode = "view" | "edit" | "delete" | null;

const emptyForm: JobForm = {
  title: "",
  slug: "",
  category: "",
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
  status: "draft",
  approvalStatus: "pending",
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
    status: job.status,
    approvalStatus: job.approvalStatus,
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

  function closeModal() {
    if (saving || deleting) return;
    setModal(null);
    setActionError("");
  }

  return (
    <section className="panel table-panel admin-jobs-panel">
      <div className="panel-head">
        <div>
          <b>All job listings</b>
          <small>{pagination.total} listings</small>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => void loadJobs()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loadError && <p className="admin-jobs-error" role="alert">{loadError}</p>}
      {loading ? (
        <p role="status">Loading job listings…</p>
      ) : !jobs.length ? (
        <div className="empty-state">No job listings found.</div>
      ) : (
        <div className="scroll-table">
          <div className="admin-job-row admin-job-head">
            <span>JOB TITLE</span><span>COMPANY</span><span>CATEGORY</span>
            <span>TYPE</span><span>LOCATION</span><span>STATUS</span><span>ACTIONS</span>
          </div>
          {jobs.map((job) => (
            <div className="admin-job-row" key={job._id}>
              <span className="admin-job-title">{job.title}</span>
              <span>{companyName(job)}</span>
              <span>{job.category}</span>
              <span>{displayEnum(job.jobType)}</span>
              <span>{job.location}</span>
              <span><i className="status-pill">{displayEnum(job.status)}</i></span>
              <span className="admin-job-actions">
                <button className="icon-btn admin-job-action" title="View job" aria-label={`View ${job.title}`} onClick={() => openModal(job, "view")}>
                  <Eye size={17} />
                </button>
                <button className="icon-btn admin-job-action" title="Edit job" aria-label={`Edit ${job.title}`} onClick={() => openModal(job, "edit")}>
                  <Pencil size={16} />
                </button>
                <button className="icon-btn admin-job-action admin-job-delete" title="Delete job" aria-label={`Delete ${job.title}`} onClick={() => openModal(job, "delete")}>
                  <Trash2 size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="admin-job-pagination">
          <button className="btn btn-outline btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      )}

      {modal && selectedJob && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          {modal === "view" && (
            <section className="modal admin-job-modal" role="dialog" aria-modal="true" aria-labelledby="admin-job-view-title">
              <button className="modal-close" onClick={closeModal} aria-label="Close"><span aria-hidden="true">×</span></button>
              <div className="kicker">JOB LISTING · READ ONLY</div>
              <h2 id="admin-job-view-title">{selectedJob.title}</h2>
              <dl className="admin-job-details">
                <div><dt>Company</dt><dd>{companyName(selectedJob)}</dd></div>
                <div><dt>Category</dt><dd>{selectedJob.category}</dd></div>
                <div><dt>Job type</dt><dd>{displayEnum(selectedJob.jobType)}</dd></div>
                <div><dt>Work mode</dt><dd>{displayEnum(selectedJob.workMode)}</dd></div>
                <div><dt>Location</dt><dd>{selectedJob.location}</dd></div>
                <div><dt>Salary</dt><dd>{formatSalary(selectedJob)}</dd></div>
                <div><dt>Experience level</dt><dd>{selectedJob.experienceLevel}</dd></div>
                <div><dt>Status</dt><dd>{displayEnum(selectedJob.status)} · {displayEnum(selectedJob.approvalStatus)}</dd></div>
                <div className="admin-job-detail-full"><dt>Description</dt><dd>{selectedJob.description}</dd></div>
                <div className="admin-job-detail-full"><dt>Required skills</dt><dd>{selectedJob.skills.length ? selectedJob.skills.join(", ") : "No skills listed"}</dd></div>
                <div className="admin-job-detail-full"><dt>Responsibilities</dt><dd>{selectedJob.responsibilities.length ? selectedJob.responsibilities.join(" · ") : "Not specified"}</dd></div>
                <div className="admin-job-detail-full"><dt>Requirements</dt><dd>{selectedJob.requirements.length ? selectedJob.requirements.join(" · ") : "Not specified"}</dd></div>
                <div className="admin-job-detail-full"><dt>Benefits</dt><dd>{selectedJob.benefits.length ? selectedJob.benefits.join(" · ") : "Not specified"}</dd></div>
                <div><dt>Application deadline</dt><dd>{selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : "None"}</dd></div>
                <div><dt>Featured</dt><dd>{selectedJob.isFeatured ? "Yes" : "No"}</dd></div>
              </dl>
            </section>
          )}

          {modal === "edit" && (
            <section className="modal admin-job-modal" role="dialog" aria-modal="true" aria-labelledby="admin-job-edit-title">
              <button className="modal-close" onClick={closeModal} aria-label="Close"><span aria-hidden="true">×</span></button>
              <div className="kicker">ADMIN JOB MANAGEMENT</div>
              <h2 id="admin-job-edit-title">Edit job</h2>
              <p>Company and employer ownership remain linked to their existing profiles.</p>
              {actionError && <p className="admin-jobs-error" role="alert">{actionError}</p>}
              <form className="form-grid admin-job-edit-form" onSubmit={saveJob}>
                <label>Job title<input className="input" required value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
                <label>Slug<input className="input" required value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} /></label>
                <label>Company<input className="input" readOnly value={companyName(selectedJob)} /></label>
                <label>Category<input className="input" required value={form.category} onChange={(event) => updateForm("category", event.target.value)} /></label>
                <label>Job type<select className="input" value={form.jobType} onChange={(event) => updateForm("jobType", event.target.value)}>{[["full-time", "Full-time"], ["part-time", "Part-time"], ["internship", "Internship"], ["contract", "Contract"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Work mode<select className="input" value={form.workMode} onChange={(event) => updateForm("workMode", event.target.value)}>{[["onsite", "On-site"], ["remote", "Remote"], ["hybrid", "Hybrid"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Location<input className="input" required value={form.location} onChange={(event) => updateForm("location", event.target.value)} /></label>
                <label>Experience level<input className="input" required value={form.experienceLevel} onChange={(event) => updateForm("experienceLevel", event.target.value)} /></label>
                <label>Minimum salary<input className="input" type="number" min="0" step="1" value={form.minSalary} onChange={(event) => updateForm("minSalary", event.target.value)} /></label>
                <label>Maximum salary<input className="input" type="number" min="0" step="1" value={form.maxSalary} onChange={(event) => updateForm("maxSalary", event.target.value)} /></label>
                <label>Application deadline<input className="input" type="date" value={form.applicationDeadline} onChange={(event) => updateForm("applicationDeadline", event.target.value)} /></label>
                <label>Job status<select className="input" value={form.status} onChange={(event) => updateForm("status", event.target.value)}>{["draft", "active", "inactive", "closed"].map((value) => <option key={value} value={value}>{displayEnum(value)}</option>)}</select></label>
                <label>Approval status<select className="input" value={form.approvalStatus} onChange={(event) => updateForm("approvalStatus", event.target.value)}>{["pending", "approved", "rejected"].map((value) => <option key={value} value={value}>{displayEnum(value)}</option>)}</select></label>
                <label className="full-field">Description<textarea className="input" required rows={5} value={form.description} onChange={(event) => updateForm("description", event.target.value)} /></label>
                <label className="full-field">Required skills <small>One item per line</small><textarea className="input" rows={3} value={form.skills} onChange={(event) => updateForm("skills", event.target.value)} /></label>
                <label className="full-field">Responsibilities <small>One item per line</small><textarea className="input" rows={3} value={form.responsibilities} onChange={(event) => updateForm("responsibilities", event.target.value)} /></label>
                <label className="full-field">Requirements <small>One item per line</small><textarea className="input" rows={3} value={form.requirements} onChange={(event) => updateForm("requirements", event.target.value)} /></label>
                <label className="full-field">Benefits <small>One item per line</small><textarea className="input" rows={3} value={form.benefits} onChange={(event) => updateForm("benefits", event.target.value)} /></label>
                <label className="admin-job-featured"><input type="checkbox" checked={form.isFeatured} onChange={(event) => updateForm("isFeatured", event.target.checked)} /> Featured job</label>
                <div className="form-footer full-field">
                  <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                </div>
              </form>
            </section>
          )}

          {modal === "delete" && (
            <section className="modal admin-job-confirm" role="alertdialog" aria-modal="true" aria-labelledby="admin-job-delete-title">
              <button className="modal-close" onClick={closeModal} aria-label="Close"><span aria-hidden="true">×</span></button>
              <div className="kicker">CONFIRM DEACTIVATION</div>
              <h2 id="admin-job-delete-title">Remove this job?</h2>
              <p><strong>{selectedJob.title}</strong> will be deactivated and removed from this listings table.</p>
              {actionError && <p className="admin-jobs-error" role="alert">{actionError}</p>}
              <div className="form-footer">
                <button className="btn btn-outline" onClick={closeModal} disabled={deleting}>Cancel</button>
                <button className="btn btn-primary" onClick={() => void deleteJob()} disabled={deleting}>{deleting ? "Removing…" : "Confirm delete"}</button>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
