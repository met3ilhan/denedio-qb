import type { Mission, MissionPhase, Prisma, ProvenanceEvent, User } from "@prisma/client";

import type { PrismaClient } from "@/shared/db/client";

export const PROVENANCE_MISSION_CREATED = "mission.created";
export const PROVENANCE_PHASE_CHANGED = "mission.phase_changed";

export type CreateMissionInput = {
  title: string;
  ownerId?: string;
  artifactRefs?: Prisma.InputJsonValue;
};

export type AppendProvenanceInput = {
  missionId: string;
  eventType: string;
  payload?: Prisma.InputJsonValue;
  actorId?: string;
};

export type MissionWithRecentEvents = Mission & {
  events: ProvenanceEvent[];
};

export class MissionRepository {
  constructor(private readonly db: PrismaClient) {}

  async createMission(input: CreateMissionInput): Promise<MissionWithRecentEvents> {
    const mission = await this.db.mission.create({
      data: {
        title: input.title,
        phase: "INTAKE",
        ownerId: input.ownerId,
        artifactRefs: input.artifactRefs,
        events: {
          create: {
            eventType: PROVENANCE_MISSION_CREATED,
            payload: {
              title: input.title,
              phase: "INTAKE",
            },
            actorId: input.ownerId,
          },
        },
      },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return mission;
  }

  async appendProvenanceEvent(input: AppendProvenanceInput): Promise<ProvenanceEvent> {
    return this.db.provenanceEvent.create({
      data: {
        missionId: input.missionId,
        eventType: input.eventType,
        payload: input.payload ?? {},
        actorId: input.actorId,
      },
    });
  }

  async setMissionPhase(
    missionId: string,
    phase: MissionPhase,
    actorId?: string,
  ): Promise<Mission> {
    const mission = await this.db.mission.update({
      where: { id: missionId },
      data: { phase },
    });

    await this.appendProvenanceEvent({
      missionId,
      eventType: PROVENANCE_PHASE_CHANGED,
      payload: { phase },
      actorId,
    });

    return mission;
  }

  async getMissionById(id: string): Promise<MissionWithRecentEvents | null> {
    return this.db.mission.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  async ensureStubUser(email: string, displayName?: string): Promise<User> {
    return this.db.user.upsert({
      where: { email },
      create: { email, displayName },
      update: { displayName },
    });
  }
}

export function createMissionRepository(db: PrismaClient): MissionRepository {
  return new MissionRepository(db);
}
