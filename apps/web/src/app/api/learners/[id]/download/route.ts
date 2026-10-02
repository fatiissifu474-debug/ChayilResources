import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStorageDriver } from "@/lib/storage";

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/learners/[id]/download — serve the learner book file. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const lesson = await db.learnerLesson.findUnique({ where: { id } });
  if (!lesson || lesson.reviewStatus !== "APPROVED") {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!lesson.fileKey) {
    return NextResponse.json({ error: "File not yet available" }, { status: 404 });
  }

  try {
    const data = await getStorageDriver().read(lesson.fileKey);
    const filename = `learner-lesson-${lesson.basicLevel}-${id.slice(-6)}.docx`;
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type":
          lesson.mimeType ??
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing from storage" }, { status: 410 });
  }
}
