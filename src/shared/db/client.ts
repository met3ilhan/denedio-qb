import { PrismaClient } from "@prisma/client";

const DENEDIO_DB_MARKERS = ["denedio", "denedio_prod", "denedio-production"];

function assertQuestionStudioDatabaseUrl(): void {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const lower = url.toLowerCase();
  for (const marker of DENEDIO_DB_MARKERS) {
    if (lower.includes(marker)) {
      throw new Error(
        "DATABASE_URL must not target Denedio. Use local Question Studio compose (see .env.example).",
      );
    }
  }
}

assertQuestionStudioDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
