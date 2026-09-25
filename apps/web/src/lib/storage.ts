import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * Storage abstraction.
 * Local dev: disk driver (STORAGE_DRIVER=disk).
 * Pilot/prod: Cloudflare R2 driver (STORAGE_DRIVER=r2), S3-compatible, zero egress fees.
 */

export interface StoredFile {
  key: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface StorageDriver {
  save(data: Buffer, key: string, mimeType: string): Promise<StoredFile>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}

class DiskStorageDriver implements StorageDriver {
  private dir: string;

  constructor() {
    this.dir = resolve(process.env.STORAGE_DIR ?? "./storage");
  }

  private pathFor(key: string): string {
    return join(this.dir, key);
  }

  async save(data: Buffer, key: string, mimeType: string): Promise<StoredFile> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    return { key, size: data.byteLength, mimeType, url: await this.getUrl(key) };
  }

  async getUrl(key: string): Promise<string> {
    // Served by the app (see a future /api/files route); absolute filesystem path as fallback.
    return `/api/files/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }
}

class R2StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  private publicUrl?: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 driver misconfigured: set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
      );
    }
    this.endpoint = endpoint;
    this.bucket = bucket;
    this.publicUrl = process.env.R2_PUBLIC_URL;
    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async save(data: Buffer, key: string, mimeType: string): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: mimeType,
      }),
    );
    return { key, size: data.byteLength, mimeType, url: await this.getUrl(key) };
  }

  async getUrl(key: string): Promise<string> {
    if (this.publicUrl) return `${this.publicUrl}/${key}`;
    // Private bucket: files are served through the authenticated download route,
    // which reads via GetObjectCommand (see read() below).
    return `/api/resources/by-key/${encodeURIComponent(key)}/download`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async read(key: string): Promise<Buffer> {
    const out = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!out.Body) throw new Error(`Empty object: ${key}`);
    const bytes = await out.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}

export function getStorageDriver(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "disk";
  if (driver === "r2") return new R2StorageDriver();
  if (driver === "disk") return new DiskStorageDriver();
  throw new Error(`Unknown STORAGE_DRIVER: ${driver} (expected "disk" or "r2")`);
}
