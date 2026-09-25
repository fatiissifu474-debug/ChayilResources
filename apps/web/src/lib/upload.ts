import { getStorageDriver } from "./storage";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export interface StoredUpload {
  key: string;
  size: number;
  mimeType: string;
}

/** Validate + store an uploaded file. Throws with a user-facing message on rejection. */
export async function storeUpload(file: File, scope: string, id: string): Promise<StoredUpload> {
  if (file.size === 0) throw new Error("Empty file");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 25 MB)");
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error(`Unsupported type: ${file.type || "unknown"}`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "upload";
  const key = `${scope}/${id}/${Date.now()}-${safe}`;
  const stored = await getStorageDriver().save(buffer, key, file.type);
  return { key: stored.key, size: stored.size, mimeType: stored.mimeType };
}
