import { NextResponse } from "next/server";

import { buildMappingPreview } from "@/modules/export/mapping-preview";
import { createExportRepository } from "@/modules/export/repository/export-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
  const preview = await buildMappingPreview(prisma, id);
  if (!preview) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  const repo = createExportRepository(prisma);
  const payload = await repo.buildPayloadForQuestion(id);
  return NextResponse.json({
    mapping: preview.mapping,
    fieldRows: preview.fieldRows,
    payloadPreview: payload,
  });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
  const body = await request.json();
  const repo = createExportRepository(prisma);
  const mapping = await repo.upsertMapping(id, body);
  const preview = await buildMappingPreview(prisma, id);
  const payload = await repo.buildPayloadForQuestion(id);
  return NextResponse.json({
    mapping,
    fieldRows: preview?.fieldRows ?? [],
    payloadPreview: payload,
  });
}
