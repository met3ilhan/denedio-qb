import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/db/client";

import {
  createMissionRepository,
  PROVENANCE_MISSION_CREATED,
} from "./mission-repository";

const runIntegration = process.env.QUESTION_STUDIO_INTEGRATION === "1" && !!process.env.DATABASE_URL;

describe.skipIf(!runIntegration)("MissionRepository (integration)", () => {
  const repo = createMissionRepository(prisma);
  const createdMissionIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (createdMissionIds.length > 0) {
      await prisma.mission.deleteMany({ where: { id: { in: createdMissionIds } } });
    }
    await prisma.$disconnect();
  });

  it("persists mission and append-only provenance in Question Studio DB", async () => {
    const mission = await repo.createMission({ title: "Integration smoke mission" });
    createdMissionIds.push(mission.id);

    expect(mission.phase).toBe("INTAKE");
    expect(mission.events.some((e) => e.eventType === PROVENANCE_MISSION_CREATED)).toBe(true);

    const appended = await repo.appendProvenanceEvent({
      missionId: mission.id,
      eventType: "test.append",
      payload: { ok: true },
    });

    const events = await prisma.provenanceEvent.findMany({
      where: { missionId: mission.id },
      orderBy: { createdAt: "asc" },
    });

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.some((e) => e.id === appended.id)).toBe(true);
  });
});
