import type { PrismaClient } from "@/shared/db/client";

export async function listRecentMissions(db: PrismaClient, limit = 12) {
  return db.mission.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
