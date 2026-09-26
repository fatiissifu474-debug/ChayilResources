import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { storeUpload } from "@/lib/upload";
import { EducationLevel, ResourceType } from "@prisma/client";

/**
 * Teacher contributions (PRD §16).
 * GET — my submissions with review status.
 * POST (multipart) — submit a draft: fields + optional file. Goes through review.
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await db.resource.findMany({
    where: { submittedById: viewer.id },
    orderBy: { createdAt: "desc" },
    include: { subject: true, classLevel: true },
  });
  return NextResponse.json({ submissions });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const str = (k: string): string => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  const title = str("title");
  const description = str("description");
  const type = str("type");
  const level = str("level");
  const copyrightHolder = str("copyrightHolder");
  const permittedUse = str("permittedUse") || "Classroom use, no redistribution";

  if (!title || !description || !copyrightHolder) {
    return NextResponse.json(
      { error: "title, description and copyrightHolder are required" },
      { status: 400 },
    );
  }
  if (!(Object.values(ResourceType) as string[]).includes(type)) {
    return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
  }
  if (!(Object.values(EducationLevel) as string[]).includes(level)) {
    return NextResponse.json({ error: "Invalid education level" }, { status: 400 });
  }

  const classLevelId = str("classLevelId") || null;
  const subjectId = str("subjectId") || null;
  if (classLevelId && !(await db.classLevel.findUnique({ where: { id: classLevelId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Unknown class" }, { status: 400 });
  }
  if (subjectId && !(await db.subject.findUnique({ where: { id: subjectId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 400 });
  }

  const author = str("author") || null;
  // Publisher attribution (PRD §17): submissions carry the org name.
  const submitter = await db.user.findUnique({
    where: { id: viewer.id },
    select: { name: true, organization: true },
  });

  const resource = await db.resource.create({
    data: {
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      type: type as ResourceType,
      level: level as EducationLevel,
      classLevelId,
      subjectId,
      author: author ?? submitter?.name ?? null,
      publisher: submitter?.organization,
      copyrightHolder: copyrightHolder.slice(0, 200),
      permittedUse: permittedUse.slice(0, 500),
      reviewStatus: "DRAFT",
      submittedById: viewer.id,
    },
  });

  const upload = form.get("file");
  if (upload instanceof File && upload.size > 0) {
    try {
      const stored = await storeUpload(upload, "resources", resource.id);
      await db.resource.update({
        where: { id: resource.id },
        data: { fileKey: stored.key, fileSize: stored.size, mimeType: stored.mimeType },
      });
    } catch (e) {
      await db.resource.delete({ where: { id: resource.id } }).catch(() => {});
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Upload failed" },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    { resource: { id: resource.id, reviewStatus: resource.reviewStatus } },
    { status: 201 },
  );
}
