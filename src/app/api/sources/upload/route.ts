import { NextResponse } from "next/server";

import { UploadService, UploadValidationError } from "@/modules/sources/services/upload-service";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
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
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("[upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
