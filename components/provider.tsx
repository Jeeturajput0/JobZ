"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { toJob, type ApiJob, type Job } from "@/data/jobs";
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
  jobTotal: number;
  jobsLoading: boolean;
  jobsError: string | null;
  saved: string[];
  apps: AppItem[];
  toggleSave: (id: string) => void;
  apply: (job: Job) => void;
  toast: (msg: string) => void;
};
const Context = createContext<Ctx | null>(null);
export function JobZProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]),
    [jobTotal, setJobTotal] = useState(0),
    [jobsLoading, setJobsLoading] = useState(true),
    [jobsError, setJobsError] = useState<string | null>(null),
    [saved, setSaved] = useState<string[]>([]),
    [apps, setApps] = useState<AppItem[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let current = true;

    async function loadJobs() {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const response = await fetch("/api/jobs?limit=100", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not load jobs.");
        }
        if (current) {
          setJobs((result.jobs as ApiJob[]).map(toJob));
          setJobTotal(Number(result.pagination?.total) || 0);
        }
      } catch (error) {
        if (current) {
          setJobsError(
            error instanceof Error ? error.message : "Could not load jobs.",
          );
        }
      } finally {
        if (current) setJobsLoading(false);
      }
    }

    void loadJobs();
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    async function loadCandidateActivity() {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meResponse.ok || (await meResponse.json()).user?.role !== "jobSeeker") return;
        const [savedResponse, applicationsResponse] = await Promise.all([
          fetch("/api/saved-jobs", { cache: "no-store" }),
          fetch("/api/applications", { cache: "no-store" }),
        ]);
        if (!savedResponse.ok || !applicationsResponse.ok) return;
        const [savedData, applicationsData] = await Promise.all([savedResponse.json(), applicationsResponse.json()]);
        if (!current) return;
        setSaved((savedData.savedJobs || []).map((item: { id: string }) => item.id));
        setApps((applicationsData.applications || []).map((item: { _id: string; jobId?: { _id?: string; title?: string; companyId?: { companyName?: string } } | null; status: string; appliedAt: string }) => ({
          id: item._id, jobId: item.jobId?._id || "", jobTitle: item.jobId?.title || "Unavailable job",
          company: item.jobId?.companyId?.companyName || "Unavailable company", status: item.status,
          date: new Date(item.appliedAt).toLocaleDateString(),
        })));
      } catch { /* Keep account activity empty when unavailable. */ }
    }
    void loadCandidateActivity();
    return () => { current = false; };
  }, []);
  const toast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2600);
  };
  const value = useMemo(
    () => ({
      jobs,
      jobTotal,
      jobsLoading,
      jobsError,
      saved,
      apps,
      toggleSave: async (id: string) => {
        const remove = saved.includes(id);
        try {
          const response = await fetch(remove ? `/api/saved-jobs?jobId=${encodeURIComponent(id)}` : "/api/saved-jobs", {
            method: remove ? "DELETE" : "POST",
            headers: remove ? undefined : { "Content-Type": "application/json" },
            body: remove ? undefined : JSON.stringify({ jobId: id }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Sign in as a job seeker to save jobs.");
          setSaved((items) => remove ? items.filter((item) => item !== id) : items.includes(id) ? items : [...items, id]);
          toast(remove ? "Removed from saved jobs" : "Job saved for later");
        } catch (error) { toast(error instanceof Error ? error.message : "Could not update saved jobs."); }
      },
      apply: async (job: Job) => {
        if (apps.some((item) => item.jobId === job.id)) { toast("You already applied to this role."); return; }
        try {
          const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Could not submit your application.");
          const application = result.application;
          setApps((items) => [{ id: application.id, jobId: job.id, jobTitle: job.title, company: job.company, status: application.status, date: new Date(application.appliedAt).toLocaleDateString() }, ...items]);
          toast("Application submitted successfully.");
        } catch (error) { toast(error instanceof Error ? error.message : "Could not submit your application."); }
      },
      toast,
    }),
    [jobs, jobTotal, jobsLoading, jobsError, saved, apps],
  );
  return (
    <MotionConfig reducedMotion="user">
    <Context.Provider value={value}>
      {children}
      <AnimatePresence>
      {notice && (
        <motion.div className="toast motion-safe-enter" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
          ✓ &nbsp;{notice}
        </motion.div>
      )}
      </AnimatePresence>
    </Context.Provider>
    </MotionConfig>
  );
}
export function useJobZ() {
  const c = useContext(Context);
  if (!c) throw new Error("useJobZ must be inside provider");
  return c;
}
