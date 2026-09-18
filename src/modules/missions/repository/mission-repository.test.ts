import type { Mission, ProvenanceEvent } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/shared/db/client";

import {
  MissionRepository,
  PROVENANCE_MISSION_CREATED,
  PROVENANCE_PHASE_CHANGED,
} from "./mission-repository";

describe("MissionRepository", () => {
  const missionCreate = vi.fn();
  const missionUpdate = vi.fn();
  const missionFindUnique = vi.fn();
  const provenanceCreate = vi.fn();
  const userUpsert = vi.fn();

  let db: PrismaClient;
  let repo: MissionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    db = {
      mission: {
        create: missionCreate,
        update: missionUpdate,
        findUnique: missionFindUnique,
      },
      provenanceEvent: {
        create: provenanceCreate,
      },
      user: {
        upsert: userUpsert,
      },
    } as unknown as PrismaClient;
    repo = new MissionRepository(db);
  });

  it("creates a mission in INTAKE with an append-only creation event", async () => {
    const created: Mission & { events: ProvenanceEvent[] } = {
      id: "mission_1",
      title: "Chapter 4 PDF",
      phase: "INTAKE",
      ownerId: null,
      artifactRefs: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [
        {
          id: "evt_1",
          missionId: "mission_1",
          actorId: null,
          eventType: PROVENANCE_MISSION_CREATED,
          payload: { title: "Chapter 4 PDF", phase: "INTAKE" },
          createdAt: new Date(),
        },
      ],
    };
    missionCreate.mockResolvedValue(created);

    const result = await repo.createMission({ title: "Chapter 4 PDF" });

    expect(result.phase).toBe("INTAKE");
    expect(missionCreate).toHaveBeenCalledWith({
      data: {
        title: "Chapter 4 PDF",
        phase: "INTAKE",
        ownerId: undefined,
        artifactRefs: undefined,
        events: {
          create: {
            eventType: PROVENANCE_MISSION_CREATED,
            payload: { title: "Chapter 4 PDF", phase: "INTAKE" },
            actorId: undefined,
          },
        },
      },
      include: {
        events: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    expect(result.events[0]?.eventType).toBe(PROVENANCE_MISSION_CREATED);
  });

  it("appends provenance without mutating prior events", async () => {
    const event: ProvenanceEvent = {
      id: "evt_2",
      missionId: "mission_1",
      actorId: "user_1",
      eventType: "extraction.started",
      payload: { jobId: "job_1" },
      createdAt: new Date(),
    };
    provenanceCreate.mockResolvedValue(event);

    const result = await repo.appendProvenanceEvent({
      missionId: "mission_1",
      eventType: "extraction.started",
      payload: { jobId: "job_1" },
      actorId: "user_1",
    });

    expect(provenanceCreate).toHaveBeenCalledWith({
      data: {
        missionId: "mission_1",
        eventType: "extraction.started",
        payload: { jobId: "job_1" },
        actorId: "user_1",
      },
    });
    expect(result.id).toBe("evt_2");
  });

  it("records phase changes as new provenance events", async () => {
    const updated: Mission = {
      id: "mission_1",
      title: "T",
      phase: "MECHANISM",
      ownerId: null,
      artifactRefs: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    missionUpdate.mockResolvedValue(updated);
    provenanceCreate.mockResolvedValue({
      id: "evt_3",
      missionId: "mission_1",
      actorId: null,
      eventType: PROVENANCE_PHASE_CHANGED,
      payload: { phase: "MECHANISM" },
      createdAt: new Date(),
    });

    const mission = await repo.setMissionPhase("mission_1", "MECHANISM");

    expect(mission.phase).toBe("MECHANISM");
    expect(provenanceCreate).toHaveBeenCalledWith({
      data: {
        missionId: "mission_1",
        eventType: PROVENANCE_PHASE_CHANGED,
        payload: { phase: "MECHANISM" },
        actorId: undefined,
      },
    });
  });
});
