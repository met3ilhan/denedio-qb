import { NextResponse } from "next/server";

import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { prisma } from "@/shared/db/client";
import { getObjectStorage } from "@/shared/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const repo = createSourceRepository(prisma);
  const source = await repo.getSourceFileById(id);
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storage = getObjectStorage();
  const bytes = await storage.getObjectBytes(source.storageKey);

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": source.mimeType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(source.originalFilename)}"`,
    },
  });
}
