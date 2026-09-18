export const MAX_SOURCE_FILE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_SOURCE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/html",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export function isAllowedMimeType(mimeType: string): boolean {
  if (ALLOWED_SOURCE_MIME_TYPES.has(mimeType)) {
    return true;
  }
  return mimeType.startsWith("image/");
}

const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".html": "text/html",
  ".htm": "text/html",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Resolve MIME when the browser sends empty or generic `application/octet-stream`. */
export function resolveSourceMimeType(filename: string, reportedType: string): string {
  const trimmed = reportedType?.trim() ?? "";
  if (
    trimmed &&
    trimmed !== "application/octet-stream" &&
    isAllowedMimeType(trimmed)
  ) {
    return trimmed;
  }

  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
  const fromExt = EXTENSION_TO_MIME[ext];
  if (fromExt) {
    return fromExt;
  }

  return trimmed || "application/octet-stream";
}

export function validateUploadSize(sizeBytes: number): string | null {
  if (sizeBytes <= 0) {
    return "File is empty";
  }
  if (sizeBytes > MAX_SOURCE_FILE_BYTES) {
    return `File exceeds ${MAX_SOURCE_FILE_BYTES} bytes`;
  }
  return null;
}
