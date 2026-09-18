import { NextResponse } from "next/server";

import {
  createExportRepository,
  ExportBlockedError,
} from "@/modules/export/repository/export-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
  const repo = createExportRepository(prisma);
  try {
    const { bundle } = await repo.exportBundle(id);
    return NextResponse.json(bundle, {
      headers: {
        "Content-Disposition": `attachment; filename="denedio-import-${id}.json"`,
      },
    });
  } catch (error) {
    if (error instanceof ExportBlockedError) {
      return NextResponse.json(
        { error: error.message, reasons: error.reasons, publishingEnabled: false },
        { status: 403 },
      );
    }
    const message = error instanceof Error ? error.message : "Export blocked";
    return NextResponse.json({ error: message, publishingEnabled: false }, { status: 403 });
  }
}
