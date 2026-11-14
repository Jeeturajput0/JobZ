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
  addJob: (job: Job) => void;
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
