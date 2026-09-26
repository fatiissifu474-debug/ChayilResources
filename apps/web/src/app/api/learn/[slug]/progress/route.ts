import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";

interface Params {
  params: Promise<{ slug: string }>;
}

/** POST /api/learn/[slug]/progress { completedStep } — record step progress. */
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const module = await db.module.findUnique({
    where: { slug },
    include: { _count: { select: { steps: true } } },
  });
  if (!module || module.reviewStatus !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as { completedStep?: unknown };
  const step =
    typeof body.completedStep === "number"
      ? Math.max(0, Math.min(Math.floor(body.completedStep), module._count.steps))
      : 0;

  const progress = await db.moduleProgress.upsert({
    where: { userId_moduleId: { userId: viewer.id, moduleId: module.id } },
    update: {
      completedStep: Math.max(step, 0),
      completed: step >= module._count.steps && module._count.steps > 0,
    },
    create: {
      userId: viewer.id,
      moduleId: module.id,
      completedStep: step,
      completed: step >= module._count.steps && module._count.steps > 0,
    },
  });

  // Never move backwards: keep the max.
  if (progress.completedStep < step) {
    await db.moduleProgress.update({
      where: { id: progress.id },
      data: { completedStep: step, completed: step >= module._count.steps },
    });
  }
  const fresh = await db.moduleProgress.findUniqueOrThrow({ where: { id: progress.id } });
  return NextResponse.json({ progress: fresh, totalSteps: module._count.steps });
}
