import { NextResponse } from "next/server";

import { createCandidateRepository } from "@/modules/candidates/repository/candidate-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as { reason?: string };
  const repo = createCandidateRepository(prisma);
  await repo.rejectCandidate(id, { reason: body.reason ?? "Expert rejected" });
  return NextResponse.json({ ok: true });
}
