import { NextResponse } from "next/server";

import {
  createQuestionRepository,
  QuestionRevisionBlockedError,
} from "@/modules/questions/repository/question-repository";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as { content?: unknown; revisionReason?: string };
  const repo = createQuestionRepository(prisma);
  try {
    const version = await repo.reviseApprovedQuestion(id, {
      content: body.content,
      revisionReason: body.revisionReason ?? "Expert revision",
    });
    return NextResponse.json({ version });
  } catch (error) {
    if (error instanceof QuestionRevisionBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
