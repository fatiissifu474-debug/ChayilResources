import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { getStorageDriver } from "@/lib/storage";

interface Params {
  params: Promise<{ id: string }>;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "resource"
  );
}

function extFor(mimeType: string | null): string {
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "text/plain": ".txt",
  };
  return (mimeType && map[mimeType]) || "";
}

/** GET /api/resources/[id]/download — logs the download, then serves the file. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();

  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource || (resource.reviewStatus !== "APPROVED" && !isStaff(viewer))) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!resource.fileKey) {
    return NextResponse.json({ error: "File not yet available" }, { status: 404 });
  }

  await db.downloadLog
    .create({ data: { resourceId: id, userId: viewer?.id } })
    .catch(() => {});

  try {
    const data = await getStorageDriver().read(resource.fileKey);
    const filename = slugify(resource.title) + extFor(resource.mimeType);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": resource.mimeType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing from storage" }, { status: 410 });
  }
}
