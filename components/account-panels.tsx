"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, FileText, Settings } from "lucide-react";

type Profile = Record<string, string | string[]>;

export function ProfileSettings({ roleKey }: { roleKey: string }) {
  const employer = roleKey === "employer";
  const endpoint = employer ? "/api/employer/profile" : "/api/job-seeker/profile";
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (response.status === 404) return {};
      if (!response.ok) throw new Error(result.message || "Could not load your profile.");
      return result.profile || {};
    }).then((value) => { if (active) setProfile(value); }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load your profile."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);
  function update(key: string, value: string) { setProfile((current) => ({ ...current, [key]: value })); }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    const payload = employer ? profile : { ...profile, skills: String(profile.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean) };
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save your profile.");
      setProfile(result.profile || profile); setMessage("Profile saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your profile."); }
    finally { setSaving(false); }
  }
  const text = (key: string) => typeof profile[key] === "string" ? profile[key] as string : "";
  return <form className="form-card" onSubmit={save}><div className="panel-head"><div><b>{employer ? "Company profile" : "Your profile"}</b><small>Profile details stored with your JobZ account.</small></div></div>{loading ? <p role="status">Loading profile…</p> : <div className="form-grid">{employer ? <><label>Company name<input className="input" required minLength={2} value={text("companyName")} onChange={(e)=>update("companyName",e.target.value)}/></label><label>Industry<input className="input" value={text("industry")} onChange={(e)=>update("industry",e.target.value)}/></label><label>Website<input className="input" type="url" value={text("website")} onChange={(e)=>update("website",e.target.value)}/></label><label>Location<input className="input" value={text("location")} onChange={(e)=>update("location",e.target.value)}/></label><label className="full-field">Company description<textarea className="input" rows={5} value={text("description")} onChange={(e)=>update("description",e.target.value)}/></label></> : <><label>Professional headline<input className="input" value={text("headline")} onChange={(e)=>update("headline",e.target.value)}/></label><label>Location<input className="input" value={text("location")} onChange={(e)=>update("location",e.target.value)}/></label><label>Skills, comma separated<input className="input" value={Array.isArray(profile.skills)?profile.skills.join(", "):text("skills")} onChange={(e)=>update("skills",e.target.value)}/></label><label>Resume URL<input className="input" type="url" value={text("resumeUrl")} onChange={(e)=>update("resumeUrl",e.target.value)}/></label><label>Portfolio URL<input className="input" type="url" value={text("portfolioUrl")} onChange={(e)=>update("portfolioUrl",e.target.value)}/></label><label>LinkedIn URL<input className="input" type="url" value={text("linkedInUrl")} onChange={(e)=>update("linkedInUrl",e.target.value)}/></label><label className="full-field">About you<textarea className="input" rows={5} value={text("summary")} onChange={(e)=>update("summary",e.target.value)}/></label></>}</div>}{message && <p role="status">{message}</p>}<div className="form-footer"><button className="btn btn-primary" disabled={saving || loading}>{saving ? "Saving…" : "Save changes"}</button></div></form>;
}

export function ResumePanel() {
  return <div className="panel resume-panel"><FileText size={32}/><h2>Resume link</h2><p>Add or update your resume URL in your profile. It can be included with applications.</p><a className="text-link" href="/job-seeker/profile">Open profile settings</a></div>;
}

export function NotificationsPanel() {
  return <div className="empty-state"><Bell/><h3>No notifications yet</h3><p>Application and account updates will appear here when available.</p></div>;
}

export function SettingsPanel() {
  return <div className="empty-state"><Settings/><h3>Account settings are not available yet</h3><p>There are no saved preferences to show.</p></div>;
}
