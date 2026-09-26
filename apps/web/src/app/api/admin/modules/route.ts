import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

function slugify(title: string): string {
  const base =
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) ||
    "module";
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Staff: list modules (drafts included) / create a module with steps (DRAFT).
 * POST body: { title, description, objectives?, durationMinutes?, audience?, steps: [{title, body}] }
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const modules = await db.module.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { _count: { select: { steps: true } } },
  });
  return NextResponse.json({ modules });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }
  const steps = Array.isArray(body.steps)
    ? body.steps
        .filter(
          (s): s is { title: unknown; body: unknown } =>
            !!s && typeof s === "object" &&
            typeof (s as { title: unknown }).title === "string" &&
            typeof (s as { body: unknown }).body === "string",
        )
        .map((s) => ({
          title: (s.title as string).trim().slice(0, 200),
          body: (s.body as string).trim().slice(0, 8000),
        }))
        .filter((s) => s.title && s.body)
    : [];
  if (steps.length === 0) {
    return NextResponse.json({ error: "At least one step is required" }, { status: 400 });
  }

  const duration =
    typeof body.durationMinutes === "number" && body.durationMinutes > 0
      ? Math.floor(body.durationMinutes)
      : null;

  const module = await db.module.create({
    data: {
      slug: slugify(title),
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      objectives:
        typeof body.objectives === "string" && body.objectives.trim()
          ? body.objectives.trim().slice(0, 2000)
          : null,
      durationMinutes: duration,
      audience:
        typeof body.audience === "string" && body.audience.trim()
          ? body.audience.trim().slice(0, 120)
          : null,
      reviewStatus: "DRAFT",
      createdById: viewer.id,
      steps: { create: steps.map((s, i) => ({ ...s, position: i + 1 })) },
    },
    select: { id: true, slug: true },
  });
  return NextResponse.json({ module }, { status: 201 });
}
