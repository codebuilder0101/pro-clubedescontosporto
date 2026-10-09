import "server-only";
import { db } from "@/lib/db";

/** Records a backoffice change: who did what, on which record. */
export async function audit(actorId: string, action: string, entityId: string | null, summary: string) {
  await db.auditLog.create({ data: { actorId, action, entityId, summary: summary.slice(0, 500) } });
}
