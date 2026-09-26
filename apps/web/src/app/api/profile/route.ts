import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EducationLevel, Role } from "@prisma/client";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileCompleted: true,
  teachingLevels: true,
  subjects: true,
  school: true,
  organization: true,
} as const;

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await db.user.findUnique({ where: { id: userId }, select: profileSelect });
  if (!profile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  const userId = await requireUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    teachingLevels?: unknown;
    subjects?: unknown;
    school?: unknown;
    organization?: unknown;
    publisher?: unknown;
  };

  const levels = Array.isArray(body.teachingLevels)
    ? body.teachingLevels.filter((l): l is EducationLevel =>
        typeof l === "string" &&
        (Object.values(EducationLevel) as string[]).includes(l),
      )
    : [];
  const subjects = Array.isArray(body.subjects)
    ? body.subjects
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .slice(0, 30)
    : [];
  const school =
    typeof body.school === "string" && body.school.trim().length > 0
      ? body.school.trim().slice(0, 120)
      : null;
  const organization =
    "organization" in body
      ? typeof body.organization === "string" && body.organization.trim().length > 0
        ? body.organization.trim().slice(0, 120)
        : null
      : undefined;

  // One-way self-upgrade: TEACHER → PUBLISHER at signup. Publishers gain the
  // portal + attribution, but every submission is still reviewed. Downgrades
  // and other role changes stay staff-only (via direct DB admin).
  const current = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const upgradeToPublisher =
    body.publisher === true && current?.role === Role.TEACHER ? Role.PUBLISHER : undefined;

  const profile = await db.user.update({
    where: { id: userId },
    data: {
      teachingLevels: levels,
      subjects,
      school,
      ...(organization !== undefined ? { organization } : {}),
      ...(upgradeToPublisher ? { role: upgradeToPublisher } : {}),
      profileCompleted: true,
    },
    select: profileSelect,
  });

  return NextResponse.json({ profile });
}
