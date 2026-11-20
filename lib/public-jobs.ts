/** Shared visibility rules for jobs that candidates can discover or apply to. */
export function publicJobFilter(now = new Date()) {
  return {
    status: "active" as const,
    approvalStatus: "approved" as const,
    $and: [
      {
        $or: [
          { applicationDeadline: { $exists: false } },
          { applicationDeadline: null },
          { applicationDeadline: { $gte: now } },
        ],
      },
    ],
  };
}

export function isPublicJob(job: {
  status?: string;
  approvalStatus?: string;
  applicationDeadline?: Date | string | null;
}, now = new Date()) {
  if (job.status !== "active" || job.approvalStatus !== "approved") return false;
  if (!job.applicationDeadline) return true;
  const deadline = new Date(job.applicationDeadline).getTime();
  return Number.isFinite(deadline) && deadline >= now.getTime();
}
