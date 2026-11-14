"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Users } from "lucide-react";

type EmployerJob = { _id: string; title: string; location: string; jobType: string; status: string; approvalStatus: string; createdAt: string; applicationCount: number };
type Applicant = { _id: string; status: string; appliedAt: string; jobId?: { title?: string } | null; jobSeekerId?: { fullName?: string; email?: string } | null };

export function EmployerJobsPanel() {
  const [jobs, setJobs] = useState<EmployerJob[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active=true; fetch("/api/employer/jobs",{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message||"Could not load job posts.");if(active)setJobs(x.jobs||[])}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Could not load job posts.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <div className="panel table-panel"><div className="panel-head"><div><b>Your job posts</b><small>{jobs.length} records from your employer account</small></div></div>{loading?<p role="status">Loading job posts…</p>:error?<p role="alert">{error}</p>:jobs.length?<div className="scroll-table">{jobs.map(job=><div className="data-row" key={job._id}><span>{job.title}</span><span>{job.location}</span><span>{job.jobType}</span><span>{job.applicationCount} applicants</span><span>{new Date(job.createdAt).toLocaleDateString()}</span><span>{job.approvalStatus==='approved'?job.status:job.approvalStatus}</span></div>)}</div>:<div className="empty-state"><BriefcaseBusiness/><h3>No job posts yet</h3><p>Post a role to see it listed in your employer workspace.</p></div>}</div>;
}

export function EmployerApplicantsPanel() {
  const [applications, setApplications] = useState<Applicant[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active=true; fetch("/api/employer/applications",{cache:"no-store"}).then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x.message||"Could not load applicants.");if(active)setApplications(x.applications||[])}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Could not load applicants.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
  return <div className="panel table-panel"><div className="panel-head"><div><b>Applicants</b><small>Applications submitted to your job posts</small></div></div>{loading?<p role="status">Loading applicants…</p>:error?<p role="alert">{error}</p>:applications.length?<div className="scroll-table">{applications.map((application)=><div className="data-row" key={application._id}><span>{application.jobSeekerId?.fullName||"Candidate account unavailable"}</span><span>{application.jobSeekerId?.email||""}</span><span>{application.jobId?.title||"Job unavailable"}</span><span>{application.status}</span><span>{new Date(application.appliedAt).toLocaleDateString()}</span></div>)}</div>:<div className="empty-state"><Users/><h3>No applications yet</h3><p>Candidate applications will appear here when someone applies.</p></div>}</div>;
}
