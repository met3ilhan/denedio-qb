import { NextResponse } from "next/server";

import { createCandidateRepository } from "@/modules/candidates/repository/candidate-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const repo = createCandidateRepository(prisma);
  const result = await repo.reverifyCandidate(id);
  return NextResponse.json(result);
}
