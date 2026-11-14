"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function PostJobForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [title, setTitle] = useState(""); const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("full-time"); const [workMode, setWorkMode] = useState("remote");
  const [location, setLocation] = useState(""); const [experienceLevel, setExperienceLevel] = useState("");
  const [minSalary, setMinSalary] = useState(""); const [maxSalary, setMaxSalary] = useState("");
  const [description, setDescription] = useState(""); const [skills, setSkills] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; fetch("/api/categories", { cache: "no-store" }).then((r)=>r.json()).then((result)=>{if(active)setCategories(result.categories||[])}).catch(()=>{if(active)setCategories([])}); return()=>{active=false}; }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(""); setSaving(true);
    try {
      const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, category, jobType, workMode, location, experienceLevel, description, skills: skills.split(",").map((item)=>item.trim()).filter(Boolean), ...(minSalary ? { minSalary: Number(minSalary) } : {}), ...(maxSalary ? { maxSalary: Number(maxSalary) } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not submit the job.");
      router.push("/employer/manage-jobs");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not submit the job."); }
    finally { setSaving(false); }
  }
  return <form className="form-card" onSubmit={(event)=>void submit(event)}><div className="form-section-title"><span>01</span><div><b>Job details</b><small>Submitted jobs are reviewed before appearing publicly.</small></div></div><div className="form-grid"><label>Job title<input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="Job title"/></label><label>Category<select className="input" value={category} onChange={(e)=>setCategory(e.target.value)} required><option value="">Choose a category</option>{categories.map((item)=><option key={item.name}>{item.name}</option>)}</select></label><label>Job type<select className="input" value={jobType} onChange={(e)=>setJobType(e.target.value)}><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option></select></label><label>Work mode<select className="input" value={workMode} onChange={(e)=>setWorkMode(e.target.value)}><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label><label>Location<input className="input" value={location} onChange={(e)=>setLocation(e.target.value)} required placeholder="City or remote"/></label><label>Experience level<input className="input" value={experienceLevel} onChange={(e)=>setExperienceLevel(e.target.value)} required placeholder="Experience level"/></label><label>Minimum salary<input className="input" type="number" min="0" value={minSalary} onChange={(e)=>setMinSalary(e.target.value)}/></label><label>Maximum salary<input className="input" type="number" min="0" value={maxSalary} onChange={(e)=>setMaxSalary(e.target.value)}/></label><label className="full-field">Description<textarea className="input" rows={5} value={description} onChange={(e)=>setDescription(e.target.value)} required placeholder="Describe the role and responsibilities"/></label><label className="full-field">Skills<input className="input" value={skills} onChange={(e)=>setSkills(e.target.value)} placeholder="Comma-separated skills"/></label></div>{error&&<p className="admin-jobs-error" role="alert">{error}</p>}<div className="form-footer"><button className="btn btn-primary" type="submit" disabled={saving||!categories.length}>{saving?"Submitting…":"Submit for review"}<ArrowRight size={16}/></button></div>{!categories.length&&<p role="status">Job categories are currently unavailable.</p>}</form>;
}
