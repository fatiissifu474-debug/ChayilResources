import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { Role } from "@prisma/client";

export interface Viewer {
  id: string;
  role: Role;
}

/** Logged-in user (id + role), or null for anonymous visitors. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
}

export function isStaff(viewer: Viewer | null): boolean {
  return viewer?.role === Role.ADMIN || viewer?.role === Role.REVIEWER;
}
