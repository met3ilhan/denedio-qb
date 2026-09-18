import { NextResponse } from "next/server";

import {
  createGenerationPipelineOrchestrator,
  GenerationBlockedError,
} from "@/modules/generation";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; runId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id: missionId, runId } = await params;

  const run = await prisma.generationRun.findUnique({ where: { id: runId } });
  if (!run || run.missionId !== missionId) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const orchestrator = createGenerationPipelineOrchestrator(prisma);
  try {
    const result = await orchestrator.spawnCandidatesForRun(runId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GenerationBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
