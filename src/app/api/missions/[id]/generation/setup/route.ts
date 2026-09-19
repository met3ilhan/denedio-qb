import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createGenerationRepository, GenerationBlockedError } from "@/modules/generation/repository/generation-repository";
import { proposeMutationPlanForFingerprintVersion } from "@/modules/generation/services/mutation-plan-proposal";
import { createFingerprintRepository } from "@/modules/fingerprints/repository/fingerprint-repository";
import { formatGeminiTransportFailure } from "@/shared/ai/gemini-failure-messages";
import { GeminiRequestError, GeminiRetryExhaustedError } from "@/shared/ai/gemini-retry";
import { resolveProviderMode } from "@/shared/ai/provider-mode";
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
    return NextResponse.json(
      { error: "Üretime geçmeden önce pedagojik parmak izini kilitleyin." },
      { status: 400 },
    );
  }

  try {
    const proposed = await proposeMutationPlanForFingerprintVersion(prisma, locked.id);
    const flags = previewTrivialMutationFlags(proposed.plan);

    return NextResponse.json({
      fingerprintVersionId: locked.id,
      samplePlan: proposed.plan,
      flags,
      plannerProviderId: proposed.plannerProviderId,
      plannerModelId: proposed.plannerModelId,
      providerMode: resolveProviderMode(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mutasyon planı oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 502 });
  }
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

  let plan;
  try {
    if (body.plan) {
      plan = mutationPlanSchema.parse(body.plan);
    } else {
      const proposed = await proposeMutationPlanForFingerprintVersion(
        prisma,
        body.fingerprintVersionId,
      );
      plan = proposed.plan;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Mutasyon planı şema doğrulamasından geçemedi",
          detail: error.message.slice(0, 500),
        },
        { status: 400 },
      );
    }
    const isGeminiTransport =
      error instanceof GeminiRetryExhaustedError ||
      error instanceof GeminiRequestError ||
      (error instanceof Error &&
        (error.message.includes("Gemini mutation planner") ||
          error.message.includes("RESOURCE_EXHAUSTED")));
    if (isGeminiTransport) {
      const { userMessage, technicalMessage } = formatGeminiTransportFailure(error);
      return NextResponse.json(
        { error: userMessage, detail: technicalMessage.slice(0, 500) },
        { status: 502 },
      );
    }
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Mutasyon planı şema doğrulamasından geçemedi", detail: detail.slice(0, 500) },
      { status: 400 },
    );
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
