"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GenericForm, ProgressBar, ResourcePanel, StatusPill, type Column } from "./ui";
import { AssessmentTaker, DocumentUploader, VerificationSubmitter } from "./candidate-tools";

type Row = Record<string, unknown>;

const statusCol = (label = "Status"): Column<Row> => ({
  key: "status", label, render: (r) => <StatusPill value={r.status || r.workflowStatus || r.verificationStatus} />,
});

export function AnalyticsPanel({ endpoint, title = "Analytics" }: { endpoint: string; title?: string }) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (active) setStats(d.analytics || null); })
      .catch(() => { if (active) setError("Unable to load analytics."); });
    return () => { active = false; };
  }, [endpoint]);
  return (
    <section className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#172B25]">{title}</h2>
      {error && <p className="mt-3 text-sm text-[#B25238]">{error}</p>}
      {!stats && !error && <p className="mt-4 text-sm text-[#71817A]">Loading analyticsÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦</p>}
      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats)
            .filter(([, value]) => typeof value === "number")
            .map(([key, value]) => (
              <div key={key} className="rounded-lg border border-[#E9EFEC] bg-[#FBFDFC] p-4">
                <p className="text-2xl font-semibold text-[#267653]">{String(value)}</p>
                <p className="mt-1 text-xs capitalize text-[#71817A]">{key.replace(/([A-Z])/g, " $1")}</p>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

export function NotificationsPanel() {
  return (
    <ResourcePanel<Row>
      title="Notifications"
      description="Status changes, invitations and updates."
      endpoint="/api/notifications"
      dataKey="notifications"
      empty="You have no notifications yet."
      columns={[
        { key: "title", label: "Title" },
        { key: "message", label: "Message" },
        { key: "createdAt", label: "Received", render: (r) => new Date(String(r.createdAt)).toLocaleDateString() },
        { key: "read", label: "Read", render: (r) => (r.read ? "Yes" : "No") },
      ]}
    />
  );
}

/* ----------------------------- CANDIDATE -------------------------------- */

export function CandidateGrowthPanel({ onRefresh }: { onRefresh?: () => void }) {
  const [completion, setCompletion] = useState<{ percentage?: number; missingSections?: string[]; recommendedActions?: string[]; verificationStatus?: string; jobReadiness?: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const [activeAssessment, setActiveAssessment] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/candidate/profile/completion", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (active) setCompletion(d.completion || null); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#E5ECE8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#172B25]">Your profile health</h2>
        {completion ? (
          <div className="mt-4 grid gap-5 md:grid-cols-[1fr_1fr]">
            <div>
              <ProgressBar value={Number(completion.percentage) || 0} />
              <p className="mt-3 text-sm text-[#71817A]">
                Verification: <StatusPill value={completion.verificationStatus} />{" "}
                Job readiness: <StatusPill value={completion.jobReadiness} />
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#34455D]">Missing sections</p>
              <p className="mt-1 text-sm text-[#71817A]">{(completion.missingSections || []).join(", ") || "Nothing missing ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â great work."}</p>
              <p className="mt-3 text-sm font-medium text-[#34455D]">Recommended actions</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-[#71817A]">
                {(completion.recommendedActions || []).map((a) => <li key={a}>{a}</li>)}
              </ul>
            </div>
          </div>
        ) : <p className="mt-4 text-sm text-[#71817A]">Loading profile completionÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦</p>}
      </section>

      <GenericForm
        title="Enhance your profile"
        description="Add your career goals and preferences. Skills can be entered as a comma-separated list."
        endpoint="/api/candidate/profile"
        method="PUT"
        fields={[
          { name: "headline", label: "Professional headline", placeholder: "e.g. Frontend Developer" },
          { name: "careerGoals", label: "Career goals", type: "textarea" },
          { name: "summary", label: "Professional summary", type: "textarea" },
          { name: "skills", label: "Skills (comma separated)", placeholder: "React, TypeScript, Node.js" },
          { name: "city", label: "City" },
          { name: "country", label: "Country" },
        ]}
        onSuccess={() => { onRefresh?.(); }}
      />

      <ResourcePanel<Row>
        title="Recommended jobs"
        description="Matched using your skills, goals and assessment results."
        endpoint="/api/candidate/matches"
        dataKey="matches"
        empty="No jobs available yet."
        columns={[
          { key: "job", label: "Role", render: (r) => String((r.job as Row)?.title || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â") },
          { key: "match", label: "Match", render: (r) => <StatusPill value={`${(r.match as Row)?.score ?? 0}%`} /> },
          { key: "skills", label: "Matched skills", render: (r) => String(((r.match as Row)?.matchedSkills as string[] || []).join(", ")) },
          { key: "missing", label: "Missing skills", render: (r) => String(((r.match as Row)?.missingSkills as string[] || []).join(", ")) },
        ]}
      />

      <ResourcePanel<Row>
        title="Opportunities from counseling teams"
        endpoint="/api/candidate/recommendations"
        dataKey="recommendations"
        empty="No recommendations yet."
        columns={[
          { key: "job", label: "Role", render: (r) => String((r.jobId as Row)?.title || "Hiring request") },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
          { key: "companyId", label: "Company", render: (r) => String((r.companyId as Row)?.name || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â") },
          { key: "candidateConsent", label: "Your response", render: (r) => <StatusPill value={r.candidateConsent} /> },
        ]}
      />

      <ResourcePanel<Row>
        title="Verification requests"
        endpoint="/api/candidate/verification"
        dataKey="requests"
        refreshKey={revision}
        empty="You have not submitted any documents for verification."
        columns={[
          { key: "category", label: "Category" },
          { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
          { key: "submittedAt", label: "Submitted", render: (r) => new Date(String(r.submittedAt)).toLocaleDateString() },
        ]}
      />

      <DocumentUploader onDone={() => setRevision((r) => r + 1)} />
      <VerificationSubmitter onDone={() => setRevision((r) => r + 1)} />

      <ResourcePanel<Row>
        title="Assessments"
        endpoint="/api/candidate/assessments"
        dataKey="assessments"
        refreshKey={revision}
        empty="No assessments are available right now."
        columns={[
          { key: "title", label: "Assessment" },
          { key: "type", label: "Type" },
          { key: "durationMinutes", label: "Minutes" },
          { key: "skills", label: "Skills" },
          { key: "id", label: "Action", render: (r) => <button onClick={() => setActiveAssessment(String(r._id || r.id))} className="rounded-lg bg-[#3FA47B] px-3 py-1.5 text-xs font-semibold text-white">Take test</button> },
        ]}
      />

      {activeAssessment && <AssessmentTaker assessmentId={activeAssessment} onDone={() => setRevision((r) => r + 1)} />}
    </div>
  );
}

/* ------------------------------- COMPANY -------------------------------- */

const memberColumns: Column<Row>[] = [
  { key: "user", label: "Member", render: (r) => String((r.userId as Row)?.fullName || r.invitedEmail || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â") },
  { key: "title", label: "Role" },
  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
  { key: "permissions", label: "Permissions", render: (r) => `${(r.permissions as string[] || []).length} granted` },
];

