import { hasPermission } from "@/lib/permissions";
import { toObjectId } from "@/lib/api";
import type { Session } from "@/lib/session";
import CounselingRecord from "@/models/CounselingRecord";
import CounselingMembership from "@/models/CounselingMembership";

/**
 * Returns candidate ids this counselor may access, or `null` when all
 * candidates are allowed (admins with the viewAll permission / super admins).
 */
export async function getAccessibleCounselingCandidateIds(
  session: Session,
): Promise<string[] | null> {
  // Only the platform super admin may see across organizations. A counseling
  // admin's "viewAll" grant means all candidates of THEIR OWN organization.
  if (session.role === "admin") return null;
  if (!session.counselingTeamId) return [];

  const records = await CounselingRecord.find({ teamId: session.counselingTeamId })
    .select("candidateId assignedTo")
    .lean();
  const teamCandidateIds = records.map((r) => String(r.candidateId));

  if (hasPermission(session.permissions, "counseling.candidates.viewAll")) {
    return Array.from(new Set(teamCandidateIds));
  }

  const membership = await CounselingMembership.findOne({
    teamId: session.counselingTeamId,
    userId: session.userId,
  }).select("assignedCandidates").lean();
  const explicitlyAssigned = (membership?.assignedCandidates || []).map(String);

  const ids = records
    .filter(
      (r) =>
        String(r.assignedTo) === session.userId ||
        explicitlyAssigned.includes(String(r.candidateId)),
    )
    .map((r) => String(r.candidateId));

  return Array.from(new Set(ids));
}

/** Ensure a counseling record exists for a candidate inside the team. */
export async function ensureCounselingRecord(teamId: string, candidateId: string, assignedTo?: string) {
  let record = await CounselingRecord.findOne({ teamId, candidateId });
  if (!record) {
    record = await CounselingRecord.create({
      teamId: toObjectId(teamId)!,
      candidateId: toObjectId(candidateId)!,
      assignedTo: assignedTo ? toObjectId(assignedTo) : null,
      workflowStatus: "newCandidate",
      history: [{ status: "newCandidate", at: new Date() }],
    });
  }
  return record;
}
