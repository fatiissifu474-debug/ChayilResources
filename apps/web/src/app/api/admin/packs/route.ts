import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { EducationLevel } from "@prisma/client";

// Preferred order when auto-assembling a pack (guides first, assessment last).
const TYPE_RANK: Record<string, number> = {
  TEXTBOOK: 0,
  TEACHER_GUIDE: 1,
  LESSON_PLAN: 2,
  SCHEME_OF_LEARNING: 3,
  READING_MATERIAL: 4,
  PRESENTATION: 5,
  VIDEO: 6,
  DIAGRAM: 7,
  TEACHING_STRATEGY: 8,
  CLASSROOM_ACTIVITY: 9,
  PRACTICAL_ACTIVITY: 10,
  WORKSHEET: 11,
  PROJECT_IDEA: 12,
  POSTER: 13,
  ASSESSMENT: 14,
  QUIZ: 15,
  EXAM_PREP: 16,
  REVISION_MATERIAL: 17,
};

/**
 * POST /api/admin/packs — create a lesson-prep pack (staff only).
 * Items are auto-assembled from approved resources for the class/subject.
 */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const level = typeof body.level === "string" ? body.level : "";
  const objectives = typeof body.objectives === "string" ? body.objectives.trim() : "";

  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }
  if (!(Object.values(EducationLevel) as string[]).includes(level)) {
    return NextResponse.json({ error: "Invalid education level" }, { status: 400 });
  }

  const classLevelId = typeof body.classLevelId === "string" && body.classLevelId ? body.classLevelId : null;
  const subjectId = typeof body.subjectId === "string" && body.subjectId ? body.subjectId : null;
  if (!classLevelId && !subjectId) {
    return NextResponse.json({ error: "classLevelId or subjectId is required" }, { status: 400 });
  }
  if (classLevelId && !(await db.classLevel.findUnique({ where: { id: classLevelId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Unknown class" }, { status: 400 });
  }
  if (subjectId && !(await db.subject.findUnique({ where: { id: subjectId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
  }

  const pack = await db.pack.create({
    data: {
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      objectives: objectives ? objectives.slice(0, 2000) : null,
      level: level as EducationLevel,
      classLevelId,
      subjectId,
      reviewStatus: "DRAFT",
      createdById: viewer.id,
    },
  });

  const candidates = await db.resource.findMany({
    where: {
      reviewStatus: "APPROVED",
      ...(classLevelId ? { classLevelId } : {}),
      ...(subjectId ? { subjectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  candidates.sort(
    (a, b) => (TYPE_RANK[a.type] ?? 99) - (TYPE_RANK[b.type] ?? 99),
  );
  const picked = candidates.slice(0, 12);

  await db.packItem.createMany({
    data: picked.map((r, i) => ({ packId: pack.id, resourceId: r.id, position: i })),
  });

  return NextResponse.json(
    { pack: { id: pack.id, itemsAssembled: picked.length } },
    { status: 201 },
  );
}

/** GET /api/admin/packs — list packs for staff (drafts included). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const packs = await db.pack.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      subject: true,
      classLevel: true,
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json({ packs });
}
