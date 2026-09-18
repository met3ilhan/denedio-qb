import { resolveProviderMode } from "../provider-mode";
import { SCHEMA_VERSION } from "@/shared/validation/primitives";

import { normalizeGeminiFingerprintPayload } from "./normalize-gemini-fingerprint";
import type { FingerprintAnalystInput, FingerprintAnalystResult, IFingerprintAnalystProvider } from "./types";
import type { FingerprintEvidenceRow } from "./types";

function buildEvidenceDraft(
  extraction: FingerprintAnalystInput["extraction"],
): { evidenceRows: FingerprintEvidenceRow[]; gapWarnings: string[] } {
  const stemBlock = extraction.blocks.find((b) => b.type === "stem") ?? extraction.blocks[0];
  const solutionBlock = extraction.blocks.find((b) => b.type === "solution");
  const gapWarnings: string[] = [];
  if (!solutionBlock?.text) {
    gapWarnings.push("Çözüm metni yok — çözüm iskeleti kanıtı kısmen çıkarımsaldır.");
  }
  const wrongChoices = extraction.choices.filter((c) => !c.isCorrect);
  if (wrongChoices.length < 2) {
    gapWarnings.push("İki veya daha az yanlış seçenek — çeldirici kapsamı sınırlı olabilir.");
  }

  return {
    evidenceRows: [
      {
        dimensionKey: "measured_skill",
        evidenceType: "source_anchor",
        pointer: { sourceBlockId: stemBlock?.blockId, page: stemBlock?.page ?? 1 },
        excerpt: extraction.stemText.slice(0, 500),
      },
    ],
    gapWarnings,
  };
}

/**
 * Live Gemini pedagogical fingerprint — failures surface as errors (no mock substitution).
 */
export class GeminiFingerprintAnalystProvider implements IFingerprintAnalystProvider {
  readonly providerId = "gemini";
  readonly modelId =
    process.env.QUESTION_STUDIO_GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  constructor(private readonly apiKey: string) {}

  async infer(input: FingerprintAnalystInput): Promise<FingerprintAnalystResult> {
    const mode = resolveProviderMode();
    if (mode !== "LIVE") {
      throw new Error("GeminiFingerprintAnalystProvider invoked outside LIVE provider mode");
    }

    const started = Date.now();
    const extractionJson = JSON.stringify({
      stemText: input.extraction.stemText,
      choices: input.extraction.choices,
      blocks: input.extraction.blocks,
      solutionText: input.extraction.solutionText,
      language: input.extraction.language,
    });

    const prompt =
      "You are a pedagogical analyst for Turkish exam questions. Analyze ONLY the provided structured extraction. " +
      "Return ONLY valid JSON (no markdown) for PedagogicalFingerprint with fields: " +
      "measured_skill, learning_objective, cognitive_operation, reasoning_pattern, solution_skeleton (array of phases with phase_id, operation_type one of parse|model|compute|compare|verify|eliminate|infer|translate, depends_on, critical_substep, description), " +
      "critical_signal { role, surface_form_notes }, hidden_constraint, reasoning_steps {min,max}, information_order, " +
      "calculation_burden one of none|light_mental|multi_step_numeric|symbolic|calculator_expected, " +
      "language_burden low|medium|high, visual_reasoning_burden none|decode_diagram|spatial_transform|graph_read|table_cross_reference|combined, " +
      "distractor_mechanisms (per wrong choice: slot, mechanism_id from MECH_* set, trap_type_ids from TRAP_* set, misconception_id, summary), " +
      "misconception_targets, trap_types, elimination_opportunities, difficulty_factors [{factor,weight primary|secondary}], " +
      "expected_solve_time_seconds {min,max}, question_archetype {archetype_id, version, label}, mutable_surface_notes. " +
      "Use Turkish exam pedagogy when stem is Turkish; do NOT invent kayak/pricing templates unless the stem is clearly math pricing. " +
      `schemaVersion must be "${SCHEMA_VERSION}". sourceQuestionId: ${input.sourceQuestionId}. ` +
      "Structured extraction JSON:\n" +
      extractionJson;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      throw new Error(
        `Gemini fingerprint analyst network error: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Gemini fingerprint analyst HTTP ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`,
      );
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error("Gemini fingerprint analyst returned empty content");
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini fingerprint analyst response did not contain JSON object");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Gemini fingerprint analyst returned invalid JSON");
    }

    const payload = normalizeGeminiFingerprintPayload(parsed, input.extraction, input.sourceQuestionId);
    const evidence = buildEvidenceDraft(input.extraction);

    return {
      payload,
      ...evidence,
      meta: {
        providerId: this.providerId,
        modelId: this.modelId,
        providerMode: "LIVE",
        latencyMs: Date.now() - started,
      },
    };
  }
}
