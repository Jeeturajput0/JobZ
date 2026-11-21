import Notification from "@/models/Notification";
import ActivityLog from "@/models/ActivityLog";
import type { Session } from "@/lib/session";

interface NotifyInput {
  userId: string | string[];
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

/** Best-effort notification fan-out. Notification failures never break a request. */
export async function notify(input: NotifyInput): Promise<void> {
  const ids = Array.isArray(input.userId) ? input.userId : [input.userId];
  if (!ids.length) return;
  try {
    await Notification.insertMany(
      ids.map((id) => ({
        userId: id,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link || "",
        data: input.data || {},
      })),
    );
  } catch (error) {
    console.error("Notification creation failed:", error);
  }
}

interface AuditInput {
  session?: Session | null;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function logActivity(input: AuditInput): Promise<void> {
  try {
    await ActivityLog.create({
      actorId: input.session?.userId || null,
      actorRole: input.session?.role || "system",
      action: input.action,
      entity: input.entity,
      entityId: input.entityId || "",
      companyId: input.session?.companyId || null,
      counselingTeamId: input.session?.counselingTeamId || null,
      description: input.description,
      metadata: input.metadata || {},
      ip: input.ip || "",
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}
