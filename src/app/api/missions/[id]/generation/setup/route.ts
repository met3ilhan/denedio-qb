import { NextResponse } from "next/server";

import { buildSampleMutationPlan } from "@/modules/generation/domain/mutation-plan-template";
import { createGenerationRepository, GenerationBlockedError } from "@/modules/generation/repository/generation-repository";
import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { previewTrivialMutationFlags } from "@/shared/validation/trivial-mutation";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id: missionId } = await params;
  const fingerprints = createFingerprintRepository(prisma);
  const locked = await fingerprints.getLockedVersionForMission(missionId);
  if (!locked) {
    return NextResponse.json({ error: "Lock a fingerprint on this mission first (S07)" }, { status: 400 });
  }

  const sample = buildSampleMutationPlan(locked.id);
  const flags = previewTrivialMutationFlags(sample);

  return NextResponse.json({
    fingerprintVersionId: locked.id,
    samplePlan: sample,
    flags,
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id: missionId } = await params;
  const body = (await request.json()) as {
    action: "preview" | "persist";
    fingerprintVersionId: string;
    plan?: unknown;
  };

  const generation = createGenerationRepository(prisma);

  try {
    await generation.assertFingerprintLockedForGeneration(body.fingerprintVersionId);
  } catch (error) {
    if (error instanceof GenerationBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const planInput =
    body.plan ??
    buildSampleMutationPlan(body.fingerprintVersionId);

  let plan;
  try {
    plan = mutationPlanSchema.parse(planInput);
  } catch {
    return NextResponse.json({ error: "Mutation plan failed schema validation" }, { status: 400 });
  }

  if (body.action === "preview") {
    return NextResponse.json({ flags: previewTrivialMutationFlags(plan) });
  }

  const run = await generation.createSetupRun(missionId, body.fingerprintVersionId);
  const siblingCount = Math.min(Math.max(Number((body as { siblingCount?: number }).siblingCount ?? 1), 1), 4);
  const savedPlans = [];
  for (let i = 0; i < siblingCount; i++) {
    const siblingPlan =
      i === 0
        ? plan
        : mutationPlanSchema.parse({
            ...plan,
            sibling_group_id: `family-${run.id}`,
            surface_mutations: [
              ...plan.surface_mutations,
              {
                dimension: "wording_structure",
                description: `Sibling ${i + 1} wording variant for question family.`,
              },
            ],
          });
    const saved = await generation.persistMutationPlan(
      run.id,
      body.fingerprintVersionId,
      siblingPlan,
      i,
    );
    savedPlans.push(saved);
  }
  await generation.markRunReady(run.id);

  return NextResponse.json({
    runId: run.id,
    planIds: savedPlans.map((p) => p.id),
    flags: previewTrivialMutationFlags(plan),
    siblingCount,
  });
}
