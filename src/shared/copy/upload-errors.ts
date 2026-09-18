import { tr } from "./tr";

export function uploadErrorMessage(code?: string): string {
  switch (code) {
    case "UNSUPPORTED_TYPE":
      return tr.upload.errors.unsupportedType;
    case "SIZE_LIMIT":
      return tr.upload.errors.sizeTooLarge;
    case "VIRUS":
      return tr.upload.errors.virus;
    case "DB_UNAVAILABLE":
      return tr.upload.errors.dbUnavailable;
    case "STORAGE_UNAVAILABLE":
      return tr.upload.errors.storageUnavailable;
    case "FILE_REQUIRED":
      return tr.upload.errors.fileRequired;
    default:
      return tr.upload.errors.generic;
  }
}
