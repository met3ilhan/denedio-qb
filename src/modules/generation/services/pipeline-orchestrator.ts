import type { Prisma } from "@prisma/client";

import { createDistractorAnalysisProvider } from "@/shared/ai/distractor";
import { createGenerationProvider, generationProviderConfigHash } from "@/shared/ai/generation";
import { createSolverProvider, solverProviderConfigHash, toSolverInput } from "@/shared/ai/solver";
import type { PrismaClient } from "@/shared/db/client";
import { distractorAnalysisSchema } from "@/shared/validation/distractor-analysis";
import { generatedQuestionSchema } from "@/shared/validation/generated-question";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { mutationPlanSchema } from "@/shared/validation/mutation-plan";
import { solverResultSchema } from "@/shared/validation/solver-result";

import { GenerationBlockedError } from "../repository/generation-repository";
import { runVerificationEngine } from "@/modules/verification/services/rule-engine";

type StageLogEntry = { at: string; stage: string; message: string };

export class GenerationPipelineOrchestrator {
  constructor(private readonly db: PrismaClient) {}

  async spawnCandidatesForRun(generationRunId: string) {
    const run = await this.db.generationRun.findUniqueOrThrow({
      where: { id: generationRunId },
      include: {
        mutationPlans: { orderBy: { siblingIndex: "asc" } },
        fingerprintVersion: {
          include: {
            fingerprint: { include: { sourceQuestion: true } },
          },
        },
      },
    });

    if (run.status !== "READY") {
      throw new GenerationBlockedError("Run must be READY before spawn");
    }
    if (run.mutationPlans.length === 0) {
      throw new GenerationBlockedError("Mutation plan required");
    }

    const fingerprint = pedagogicalFingerprintSchema.parse(run.fingerprintVersion.payload);
    const sourceQuestionId = run.fingerprintVersion.fingerprint.sourceQuestionId;
    const sourceStem =
      (run.fingerprintVersion.fingerprint.sourceQuestion.structured as { stemText?: string })
        ?.stemText ?? undefined;

    const generator = createGenerationProvider();
    const distractorProvider = createDistractorAnalysisProvider();
    const solverProvider = createSolverProvider();

    if (generationProviderConfigHash(generator) === solverProviderConfigHash(solverProvider)) {
      throw new Error("Solver provider config must differ from generation provider config");
    }

    const log: StageLogEntry[] = [];
    const appendLog = (stage: string, message: string) => {
      log.push({ at: new Date().toISOString(), stage, message });
    };

    await this.db.generationRun.update({
      where: { id: generationRunId },
      data: {
        status: "RUNNING",
        providerId: generator.providerId,
        modelId: generator.modelId,
      },
    });

    const siblingPlans = run.mutationPlans.map((p) => mutationPlanSchema.parse(p.payload));
    const createdIds: string[] = [];

    try {
      for (const planRow of run.mutationPlans) {
        const plan = mutationPlanSchema.parse(planRow.payload);
        appendLog("generate", `Plan ${planRow.id} sibling ${planRow.siblingIndex}`);

        const { output: draft } = await generator.generate({
          context: {
            missionId: run.missionId,
            generationRunId,
            mutationPlanId: planRow.id,
            sourceQuestionId,
            fingerprintVersionId: run.fingerprintVersionId,
          },
          fingerprint,
          plan,
        });

        const candidate = await this.db.generatedQuestionCandidate.create({
          data: {
            generationRunId,
            mutationPlanId: planRow.id,
            siblingIndex: planRow.siblingIndex,
            status: "DRAFT",
            draft: draft as Prisma.InputJsonValue,
          },
        });
        createdIds.push(candidate.id);

        const { output: distractor } = await distractorProvider.analyze({
          question: draft,
          plan,
          candidateId: candidate.id,
        });

        const mergedDraft = mergeDistractorOntoChoices(draft, distractor);

        const solverInput = toSolverInput(mergedDraft);
        const { output: solverRaw } = await solverProvider.solve(solverInput);
        const expected = mergedDraft.choices.find((c) => c.isCorrect)?.label ?? "B";
        const solver = solverResultSchema.parse({
          ...solverRaw,
          matches_expected_correct: solverRaw.selected_label === expected,
        });

        await this.db.generatedQuestionCandidate.update({
          where: { id: candidate.id },
          data: {
            draft: mergedDraft as Prisma.InputJsonValue,
            distractorAnalysis: distractor as Prisma.InputJsonValue,
            status: "SOLVED",
          },
        });

        await this.db.solverRun.create({
          data: {
            candidateId: candidate.id,
            independentOfGenerationRunId: generationRunId,
            providerId: solverProvider.providerId,
            modelId: solverProvider.modelId,
            result: solver as Prisma.InputJsonValue,
          },
        });

        const verification = runVerificationEngine({
          candidateId: candidate.id,
          question: mergedDraft,
          plan,
          fingerprint,
          distractor,
          solver,
          sourceStem,
          siblingPlans: siblingPlans.filter((_, i) => run.mutationPlans[i]?.id !== planRow.id),
        });

        await this.db.verifierRun.create({
          data: {
            candidateId: candidate.id,
            result: verification as Prisma.InputJsonValue,
          },
        });

        await this.db.generatedQuestionCandidate.update({
          where: { id: candidate.id },
          data: { status: "VERIFIED" },
        });

        appendLog("verify", `Candidate ${candidate.id} → ${verification.quality_gate}`);
      }

      await this.db.generationRun.update({
        where: { id: generationRunId },
        data: {
          status: "SUCCEEDED",
          stageLog: log as Prisma.InputJsonValue,
        },
      });

      return { candidateIds: createdIds, stageLog: log };
    } catch (error) {
      await this.db.generationRun.update({
        where: { id: generationRunId },
        data: {
          status: "FAILED",
          stageLog: log as Prisma.InputJsonValue,
        },
      });
      throw error;
    }
  }
}

function mergeDistractorOntoChoices(
  question: ReturnType<typeof generatedQuestionSchema.parse>,
  distractor: ReturnType<typeof distractorAnalysisSchema.parse>,
) {
  return generatedQuestionSchema.parse({
    ...question,
    choices: question.choices.map((choice) => {
      if (choice.isCorrect) return choice;
      const meta = distractor.wrong_choices.find((w) => w.choice_label === choice.label);
      if (!meta) return choice;
      return {
        ...choice,
        mechanism_id: meta.mechanism_id,
        trap_type_ids: [...meta.trap_type_ids],
        misconception_id: meta.misconception_id,
        error_path_id: `path_${choice.label}`,
      };
    }),
  });
}

export function createGenerationPipelineOrchestrator(db: PrismaClient) {
  return new GenerationPipelineOrchestrator(db);
}
