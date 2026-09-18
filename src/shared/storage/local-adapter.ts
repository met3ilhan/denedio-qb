import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredObject = {
  storageKey: string;
  sizeBytes: number;
  checksumSha256: string;
};

export interface ObjectStorageAdapter {
  putObject(
    storageKey: string,
    body: Buffer,
    _mimeType: string,
  ): Promise<StoredObject>;
  getObjectBytes(storageKey: string): Promise<Buffer>;
  getPublicPath(storageKey: string): string;
}

function defaultRootDir(): string {
  return process.env.QUESTION_STUDIO_STORAGE_ROOT ?? path.join(process.cwd(), ".data", "uploads");
}

export class LocalObjectStorageAdapter implements ObjectStorageAdapter {
  constructor(private readonly rootDir: string = defaultRootDir()) {}

  private resolveKey(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
    if (normalized.includes("..")) {
      throw new Error("Invalid storage key");
    }
    return path.join(this.rootDir, normalized);
  }

  async putObject(storageKey: string, body: Buffer, _mimeType: string): Promise<StoredObject> {
    const target = this.resolveKey(storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    const checksumSha256 = createHash("sha256").update(body).digest("hex");
    return { storageKey, sizeBytes: body.length, checksumSha256 };
  }

  async getObjectBytes(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveKey(storageKey));
  }

  getPublicPath(storageKey: string): string {
    return this.resolveKey(storageKey);
  }
}

let singleton: ObjectStorageAdapter | undefined;

export function getObjectStorage(): ObjectStorageAdapter {
  if (!singleton) {
    singleton = new LocalObjectStorageAdapter();
  }
  return singleton;
}
