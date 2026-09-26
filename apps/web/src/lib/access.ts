import { db } from "./db";
import type { Viewer } from "./require-user";
import { AccessLevel } from "@prisma/client";

/**
 * Hybrid access model (PRD §25): discovery is open, but downloading a
 * PREMIUM resource requires an entitlement — a personal PREMIUM grant
 * (optionally expiring) or membership in an active institution.
 * Staff always pass (they must preview premium content for review).
 */
export async function hasActiveEntitlement(userId: string): Promise<boolean> {
  const now = new Date();
  const [personal, membership] = await Promise.all([
    db.entitlement.findFirst({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    }),
    db.institutionMember.findFirst({
      where: { userId, institution: { active: true } },
      select: { id: true },
    }),
  ]);
  return !!personal || !!membership;
}

export async function canDownloadResource(
  viewer: Viewer | null,
  access: AccessLevel,
  staffBypass = true,
): Promise<boolean> {
  if (access === AccessLevel.FREE) return true;
  if (!viewer) return false;
  if (staffBypass && (viewer.role === "ADMIN" || viewer.role === "REVIEWER")) return true;
  return hasActiveEntitlement(viewer.id);
}

/** Human-readable access label for the teacher's own status. */
export async function describeAccess(userId: string): Promise<"Premium" | "Institutional" | "Free"> {
  const now = new Date();
  const [personal, membership] = await Promise.all([
    db.entitlement.findFirst({
      where: {
        userId,
        kind: "PREMIUM",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    }),
    db.institutionMember.findFirst({
      where: { userId, institution: { active: true } },
      select: { institution: { select: { name: true } } },
    }),
  ]);
  if (personal) return "Premium";
  if (membership) return "Institutional";
  return "Free";
}
