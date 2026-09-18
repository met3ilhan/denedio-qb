import { NextResponse } from "next/server";

import { createExportRepository } from "@/modules/export/repository/export-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
  const repo = createExportRepository(prisma);
  try {
    const result = await repo.runDryRunForQuestion(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dry-run failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ latest: null });
  }
  const repo = createExportRepository(prisma);
  const latest = await repo.latestDryRun(id);
  return NextResponse.json({ latest });
}
