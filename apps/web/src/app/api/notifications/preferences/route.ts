import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

/** GET — my preferences (created with defaults on first read). PATCH — update booleans. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await db.notificationPreference.upsert({
    where: { userId: viewer.id },
    update: {},
    create: { userId: viewer.id },
  });
  return NextResponse.json({ preferences });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const pick = (k: string): boolean | undefined =>
    typeof body[k] === "boolean" ? (body[k] as boolean) : undefined;

  const data = {
    ...(pick("newInSubjects") !== undefined ? { newInSubjects: pick("newInSubjects") as boolean } : {}),
    ...(pick("savedUpdates") !== undefined ? { savedUpdates: pick("savedUpdates") as boolean } : {}),
    ...(pick("announcements") !== undefined ? { announcements: pick("announcements") as boolean } : {}),
  };

  const preferences = await db.notificationPreference.upsert({
    where: { userId: viewer.id },
    update: data,
    create: { userId: viewer.id, ...data },
  });
  return NextResponse.json({ preferences });
}
