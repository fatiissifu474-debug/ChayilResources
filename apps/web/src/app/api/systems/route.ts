import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/systems — active education systems for the browse switcher. */
export async function GET() {
  const systems = await db.educationSystem.findMany({
    where: { active: true },
    orderBy: { country: "asc" },
    select: { id: true, country: true, name: true },
  });
  return NextResponse.json({ systems });
}
