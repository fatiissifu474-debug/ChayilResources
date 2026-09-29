import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/packs/list — approved packs (id + title) for pickers. */
export async function GET() {
  const packs = await db.pack.findMany({
    where: { reviewStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true },
  });
  return NextResponse.json({ packs });
}
