import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { EducationLevel, ResourceType } from "@prisma/client";

/** POST /api/admin/resources — create a draft resource (staff only). */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const level = typeof body.level === "string" ? body.level : "";
  const copyrightHolder = typeof body.copyrightHolder === "string" ? body.copyrightHolder.trim() : "";
  const permittedUse = typeof body.permittedUse === "string" ? body.permittedUse.trim() : "";

  if (!title || !description || !copyrightHolder || !permittedUse) {
    return NextResponse.json({ error: "title, description, copyrightHolder and permittedUse are required" }, { status: 400 });
  }
  if (!(Object.values(ResourceType) as string[]).includes(type)) {
    return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
  }
  if (!(Object.values(EducationLevel) as string[]).includes(level)) {
    return NextResponse.json({ error: "Invalid education level" }, { status: 400 });
  }

  const classLevelId = typeof body.classLevelId === "string" && body.classLevelId ? body.classLevelId : null;
  const subjectId = typeof body.subjectId === "string" && body.subjectId ? body.subjectId : null;
  if (classLevelId && !(await db.classLevel.findUnique({ where: { id: classLevelId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Unknown class" }, { status: 400 });
  }
  if (subjectId && !(await db.subject.findUnique({ where: { id: subjectId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
  }
  const topicIds = Array.isArray(body.topicIds)
    ? body.topicIds.filter((t): t is string => typeof t === "string")
    : [];

  const resource = await db.resource.create({
    data: {
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      type: type as ResourceType,
      level: level as EducationLevel,
      classLevelId,
      subjectId,
      author: typeof body.author === "string" ? body.author.trim().slice(0, 200) || null : null,
      publisher: typeof body.publisher === "string" ? body.publisher.trim().slice(0, 200) || null : null,
      copyrightHolder: copyrightHolder.slice(0, 200),
      permittedUse: permittedUse.slice(0, 500),
      reviewStatus: "DRAFT",
      topics: topicIds.length > 0 ? { create: topicIds.map((topicId) => ({ topicId })) } : undefined,
    },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
