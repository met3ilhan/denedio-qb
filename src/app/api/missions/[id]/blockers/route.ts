import { NextResponse } from "next/server";

import { listMissionBlockers } from "@/modules/missions/services/mission-blockers";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ blockers: [] });
  }
  const blockers = await listMissionBlockers(prisma, id);
  return NextResponse.json({ blockers });
}
