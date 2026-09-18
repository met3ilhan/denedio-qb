import { NextResponse } from "next/server";

import { listHomeMissionSummaries } from "@/modules/missions/services/mission-blockers";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ missions: [] });
  }
  const missions = await listHomeMissionSummaries(prisma);
  return NextResponse.json({ missions });
}
