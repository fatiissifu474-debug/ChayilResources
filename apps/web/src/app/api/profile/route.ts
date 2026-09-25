import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EducationLevel } from "@prisma/client";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileCompleted: true,
  teachingLevels: true,
  subjects: true,
  school: true,
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

  const profile = await db.user.update({
    where: { id: userId },
    data: {
      teachingLevels: levels,
      subjects,
      school,
      profileCompleted: true,
    },
    select: profileSelect,
  });

  return NextResponse.json({ profile });
}
