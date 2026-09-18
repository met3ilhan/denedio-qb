import { NextResponse } from "next/server";

import { createSourceRepository } from "@/modules/sources/repository/source-repository";
import { getExtractionWorker } from "@/modules/sources/services/extraction-worker";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const repo = createSourceRepository(prisma);
  const job = await repo.getLatestJobForSource(id);
  if (!job) {
    return NextResponse.json({ error: "No extraction job" }, { status: 404 });
  }
  return NextResponse.json({ job });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  const repo = createSourceRepository(prisma);
  const latest = await repo.getLatestJobForSource(id);

  if (body.action === "retry") {
    if (latest && latest.status === "RUNNING") {
      return NextResponse.json({ error: "Job still running" }, { status: 409 });
    }
    const job = await repo.createExtractionJob(id);
    getExtractionWorker(prisma).enqueue(job.id);
    return NextResponse.json({ job });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
