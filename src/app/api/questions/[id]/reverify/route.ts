import { NextResponse } from "next/server";

import {
  createQuestionRepository,
  QuestionRevisionBlockedError,
} from "@/modules/questions/repository/question-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const repo = createQuestionRepository(prisma);
  try {
    const result = await repo.reverifyLatestVersion(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof QuestionRevisionBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
