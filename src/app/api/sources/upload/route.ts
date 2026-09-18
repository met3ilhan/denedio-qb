import { NextResponse } from "next/server";

import { UploadService, UploadValidationError } from "@/modules/sources/services/upload-service";
import { uploadErrorMessage } from "@/shared/copy/upload-errors";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

function isPrismaConnectionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: string }).code === "string" &&
    ["P1001", "P1000", "P1017"].includes((error as { code: string }).code)
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: uploadErrorMessage("FILE_REQUIRED"), code: "FILE_REQUIRED" },
        { status: 400 },
      );
    }

    const service = new UploadService(prisma);
    const result = await service.uploadIntake({
      file,
      subjectHint: String(form.get("subjectHint") ?? ""),
      languageHint: String(form.get("languageHint") ?? ""),
      notes: String(form.get("notes") ?? ""),
      missionTitle: String(form.get("missionTitle") ?? ""),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json(
        { error: uploadErrorMessage(error.code), code: error.code },
        { status: 400 },
      );
    }
    if (isPrismaConnectionError(error)) {
      console.error("[upload] database unavailable", error);
      return NextResponse.json(
        { error: uploadErrorMessage("DB_UNAVAILABLE"), code: "DB_UNAVAILABLE" },
        { status: 503 },
      );
    }
    if (error instanceof Error && /ENOENT|EACCES|Invalid storage key/i.test(error.message)) {
      console.error("[upload] storage error", error);
      return NextResponse.json(
        { error: uploadErrorMessage("STORAGE_UNAVAILABLE"), code: "STORAGE_UNAVAILABLE" },
        { status: 500 },
      );
    }
    console.error("[upload]", error);
    return NextResponse.json(
      { error: uploadErrorMessage(undefined), code: "UPLOAD_FAILED" },
      { status: 500 },
    );
  }
}
