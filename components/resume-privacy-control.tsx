"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function ResumePrivacyControl() {
  const [available, setAvailable] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/job-seeker/profile", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => {
        if (!active || !result?.profile) return;
        setAvailable(Boolean(result.profile.resumeUrl));
        setIsPublic(Boolean(result.profile.resumePublic));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function saveVisibility(nextValue: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/job-seeker/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumePublic: nextValue }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update resume visibility.");
      setIsPublic(nextValue);
      setMessage(nextValue ? "Resume is visible on your public profile." : "Resume is private on your public profile.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update resume visibility.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-5 border-t border-[#E5ECE8] pt-4">
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#294538]">
      {isPublic ? <Eye className="size-4 text-[#3FA47B]" /> : <EyeOff className="size-4 text-[#71817A]" />}
      Public profile visibility
    </div>
    <p className="mb-3 text-sm leading-6 text-[#71817A]">{available ? "Choose whether recruiters can open your resume from your public profile." : "Add a resume link in Profile settings before making it public."}</p>
    <label className={`flex items-start gap-2.5 text-sm text-[#52635B] ${!available || busy ? "opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" checked={isPublic} disabled={!available || busy} onChange={(event) => void saveVisibility(event.target.checked)} className="mt-0.5 size-4 accent-[#3FA47B]" />
      Show my resume on my public profile
    </label>
    {message && <p role="status" className="mt-2 text-xs text-[#52635B]">{message}</p>}
  </div>;
}
