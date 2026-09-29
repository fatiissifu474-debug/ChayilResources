import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";

function slugify(title: string): string {
  const base =
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) ||
    "path";
  return `${base}-${Date.now().toString(36)}`;
}

/** Staff: list paths (drafts included) / create a path from approved modules. */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const paths = await db.learningPath.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json({ paths });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const moduleIds = Array.isArray(body.moduleIds)
    ? body.moduleIds.filter((m): m is string => typeof m === "string")
    : [];
  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }
  if (moduleIds.length === 0) {
    return NextResponse.json({ error: "At least one module is required" }, { status: 400 });
  }
  const modules = await db.module.findMany({
    where: { id: { in: moduleIds }, reviewStatus: "APPROVED" },
    select: { id: true },
  });
  if (modules.length !== moduleIds.length) {
    return NextResponse.json({ error: "All modules must exist and be approved" }, { status: 400 });
  }

  const path = await db.learningPath.create({
    data: {
      slug: slugify(title),
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      reviewStatus: "DRAFT",
      createdById: viewer.id,
      items: { create: moduleIds.map((moduleId, i) => ({ moduleId, position: i + 1 })) },
    },
    select: { id: true, slug: true },
  });
  return NextResponse.json({ path }, { status: 201 });
}
