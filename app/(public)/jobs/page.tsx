import type { Metadata } from "next";
import { Suspense } from "react";
import { JobsPage } from "@/components/site";
export const metadata: Metadata = {
  title: "Find jobs",
  description:
    "Search current job openings by role, location, category, work style, and experience.",
  alternates: { canonical: "/jobs" },
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <main aria-label="Loading job search" className="min-h-screen bg-[#F7F9F8] px-4 py-8 sm:px-7 lg:px-9">
          <div className="mx-auto max-w-[1360px] animate-pulse">
            <div className="h-44 rounded-2xl border border-[#E5ECE8] bg-[#EEF5F0] sm:h-48" />
            <div className="mt-7 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"><div className="hidden h-[520px] rounded-2xl border border-[#E5ECE8] bg-white lg:block" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-64 rounded-2xl border border-[#E5ECE8] bg-white" /><div className="h-64 rounded-2xl border border-[#E5ECE8] bg-white" /></div></div>
          </div>
        </main>
      }
    >
      <JobsPage />
    </Suspense>
  );
}
