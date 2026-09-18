import { NextResponse } from "next/server";

import {
  CandidateBlockedError,
  createCandidateRepository,
} from "@/modules/candidates/repository/candidate-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    checklist?: Record<string, boolean>;
    comment?: string;
  };

  const repo = createCandidateRepository(prisma);
  try {
    const result = await repo.approveCandidate(id, {
      checklist: body.checklist ?? { mechanism_preserved: true, solver_consistent: true },
      comment: body.comment,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CandidateBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
