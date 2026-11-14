"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedJobs, type Job } from "@/data/jobs";
type AppItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  date: string;
};
type Ctx = {
  jobs: Job[];
  saved: string[];
  apps: AppItem[];
  toggleSave: (id: string) => void;
  apply: (job: Job) => void;
  addJob: (job: Job) => void;
  toast: (msg: string) => void;
};
const Context = createContext<Ctx | null>(null);
export function JobZProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState(seedJobs),
    [saved, setSaved] = useState<string[]>([]),
    [apps, setApps] = useState<AppItem[]>([]),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      setJobs(
        JSON.parse(localStorage.getItem("jobz_jobs") || "null") || seedJobs,
      );
      setSaved(JSON.parse(localStorage.getItem("jobz_saved") || "[]"));
      setApps(JSON.parse(localStorage.getItem("jobz_apps") || "[]"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      localStorage.setItem("jobz_jobs", JSON.stringify(jobs));
      localStorage.setItem("jobz_saved", JSON.stringify(saved));
      localStorage.setItem("jobz_apps", JSON.stringify(apps));
    }
  }, [jobs, saved, apps, ready]);
  const toast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2600);
  };
  const value = useMemo(
    () => ({
      jobs,
      saved,
      apps,
      toggleSave: (id: string) => {
        setSaved((s) =>
          s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
        );
        toast(
          saved.includes(id)
            ? "Removed from saved jobs"
            : "Job saved for later",
        );
      },
      apply: (j: Job) => {
        if (apps.some((a) => a.jobId === j.id)) {
          toast("You’ve already applied to this role");
          return;
        }
        setApps((a) => [
          {
            id: Date.now().toString(),
            jobId: j.id,
            jobTitle: j.title,
            company: j.company,
            status: "Pending",
            date: new Date().toLocaleDateString(),
          },
          ...a,
        ]);
        toast("Application sent. Good luck!");
      },
      addJob: (j: Job) => {
        setJobs((x) => [j, ...x]);
        toast("Your job is now live");
      },
      toast,
    }),
    [jobs, saved, apps],
  );
  return (
    <Context.Provider value={value}>
      {children}
      {notice && (
        <div className="toast" role="status">
          ✓ &nbsp;{notice}
        </div>
      )}
    </Context.Provider>
  );
}
export function useJobZ() {
  const c = useContext(Context);
  if (!c) throw new Error("useJobZ must be inside provider");
  return c;
}
