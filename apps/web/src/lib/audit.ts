import { db } from "./db";

/**
 * Staff audit trail (Phase 5 governance): who did what to which record.
 * Fire-and-forget — auditing must never break the action itself.
 */
export async function logStaffAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: string,
): Promise<void> {
  await db.auditLog
    .create({ data: { actorId, action, targetType, targetId, detail } })
    .catch(() => {});
}
