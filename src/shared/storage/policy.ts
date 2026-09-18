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

export function validateUploadSize(sizeBytes: number): string | null {
  if (sizeBytes <= 0) {
    return "File is empty";
  }
  if (sizeBytes > MAX_SOURCE_FILE_BYTES) {
    return `File exceeds ${MAX_SOURCE_FILE_BYTES} bytes`;
  }
  return null;
}
