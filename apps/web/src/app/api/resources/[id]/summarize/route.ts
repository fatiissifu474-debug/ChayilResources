import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/require-user";
import { summarizeResource, AIUnavailableError } from "@/lib/ai";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/resources/[id]/summarize — Groq summary, cached on first generation. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resource = await db.resource.findUnique({
    where: { id },
    include: { subject: true },
  });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (resource.aiSummary) return NextResponse.json({ summary: resource.aiSummary, cached: true });

  try {
    const summary = await summarizeResource({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      level: resource.level,
      subject: resource.subject?.name ?? null,
    });
    await db.resource.update({ where: { id }, data: { aiSummary: summary } });
    return NextResponse.json({ summary, cached: false });
  } catch (e) {
    if (e instanceof AIUnavailableError) {
      return NextResponse.json({ error: "AI summaries are not configured yet" }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not generate a summary right now" }, { status: 502 });
  }
}
