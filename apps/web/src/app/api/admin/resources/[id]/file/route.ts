import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewer, isStaff } from "@/lib/require-user";
import { getStorageDriver } from "@/lib/storage";
import { storeUpload } from "@/lib/upload";

interface Params {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/resources/[id]/file — attach/replace the resource file (staff only). */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isStaff(viewer)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  let stored;
  try {
    stored = await storeUpload(file, "resources", id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
  const driver = getStorageDriver();

  if (resource.fileKey && resource.fileKey !== stored.key) {
    await driver.delete(resource.fileKey).catch(() => {});
  }

  const updated = await db.resource.update({
    where: { id },
    data: { fileKey: stored.key, fileSize: stored.size, mimeType: stored.mimeType },
    select: { id: true, fileKey: true, fileSize: true, mimeType: true },
  });

  return NextResponse.json({ resource: updated });
}
