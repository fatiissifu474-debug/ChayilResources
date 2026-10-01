import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { generateLessonPrep } from "@/lib/ai";
import { rateLimit, clientKey, limitedResponse } from "@/lib/ratelimit";

/**
 * POST /api/assistant/prep { level, classLevelId?, subject, topic } —
 * structured lesson preparation + matching library resources.
 */
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "assistant"), 5)) return limitedResponse();
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const level = typeof body.level === "string" ? body.level : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!level || !subject || !topic) {
    return NextResponse.json({ error: "level, subject and topic are required" }, { status: 400 });
  }

  let className: string | null = null;
  let classLevelId: string | null = null;
  if (typeof body.classLevelId === "string" && body.classLevelId) {
    const cls = await db.classLevel.findUnique({
      where: { id: body.classLevelId },
      select: { id: true, name: true },
    });
    if (cls) {
      className = cls.name;
      classLevelId = cls.id;
    }
  }

  try {
    const prep = await generateLessonPrep({ level, className, subject, topic });
    const matches = await db.resource.findMany({
      where: {
        reviewStatus: "APPROVED",
        ...(classLevelId ? { classLevelId } : {}),
        OR: [
          { title: { contains: topic, mode: "insensitive" } },
          { description: { contains: topic, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { subject: true, classLevel: true },
    });
    return NextResponse.json({ prep, matches });
  } catch {
    return NextResponse.json({ error: "The assistant is unavailable right now" }, { status: 502 });
  }
}
