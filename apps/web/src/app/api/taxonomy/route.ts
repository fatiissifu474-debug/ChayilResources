import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EducationLevel } from "@prisma/client";

const ALL_LEVELS = Object.values(EducationLevel);

/** GET /api/taxonomy?levels=JHS,PRIMARY → classes + subjects for onboarding filters. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = (searchParams.get("levels") ?? "")
    .split(",")
    .map((l) => l.trim().toUpperCase())
    .filter((l): l is EducationLevel =>
      (ALL_LEVELS as string[]).includes(l),
    );
  const where = requested.length > 0 ? { level: { in: requested } } : {};

  const [classes, subjects] = await Promise.all([
    db.classLevel.findMany({
      where,
      orderBy: [{ level: "asc" }, { position: "asc" }],
    }),
    db.subject.findMany({
      where,
      orderBy: [{ level: "asc" }, { name: "asc" }],
    }),
  ]);

  return NextResponse.json({ classes, subjects });
}
