"use client";

import { useMemo } from "react";

import { verifyDistractorCausality } from "@/modules/verification/services/distractor-causality";
import type { DistractorAnalysis } from "@/shared/validation/distractor-analysis";
import { distractorChoiceAnalysisSchema } from "@/shared/validation/distractor-analysis";
import type { z } from "zod";

type DistractorChoiceAnalysis = z.infer<typeof distractorChoiceAnalysisSchema>;
import type { GeneratedQuestion } from "@/shared/validation/generated-question";
import { MECHANISM_IDS, TRAP_TYPE_IDS } from "@/shared/validation/pedagogy-enums";

type DistractorCausalityEditorProps = {
  draft: GeneratedQuestion;
  distractor: DistractorAnalysis;
  onChange: (next: DistractorAnalysis) => void;
  selectedLabel: string;
  onSelectLabel: (label: string) => void;
  showRail?: boolean;
};

const causalityStatusLabel: Record<string, string> = {
  SUPPORTED: "Verified (supported)",
  PLAUSIBLE: "Supported (qualitative)",
  UNVERIFIED: "Unverified",
  CONTRADICTED: "Contradicted",
};

export function DistractorCausalityEditor({
  draft,
  distractor,
  onChange,
  selectedLabel,
  onSelectLabel,
  showRail = true,
}: DistractorCausalityEditorProps) {
  const wrongLabels = draft.choices.filter((c) => !c.isCorrect).map((c) => c.label);

  const selectedEntry = useMemo(
    () => distractor.wrong_choices.find((w) => w.choice_label === selectedLabel),
    [distractor, selectedLabel],
  );

  const choiceText = draft.choices.find((c) => c.label === selectedLabel)?.text ?? "";

  const causalityFindings = useMemo(
    () => verifyDistractorCausality(draft, distractor),
    [draft, distractor],
  );

  const selectedFinding = causalityFindings.find((f) => f.choice_label === selectedLabel);

  function updateEntry(patch: Partial<DistractorChoiceAnalysis>) {
    if (!selectedEntry) return;
    const wrong_choices = distractor.wrong_choices.map((w) =>
      w.choice_label === selectedLabel ? { ...w, ...patch } : w,
    );
    onChange({ ...distractor, wrong_choices });
  }

  function updateStep(order: number, student_action: string) {
    if (!selectedEntry) return;
    const steps = selectedEntry.steps.map((s) =>
      s.order === order ? { ...s, student_action } : s,
    );
    updateEntry({ steps });
  }

  function addStep() {
    if (!selectedEntry || selectedEntry.steps.length >= 3) return;
    const order = selectedEntry.steps.length + 1;
    updateEntry({
      steps: [...selectedEntry.steps, { order, student_action: "" }],
    });
  }

  function toggleTrap(trap: string) {
    if (!selectedEntry) return;
    const set = new Set(selectedEntry.trap_type_ids);
    if (set.has(trap as (typeof selectedEntry.trap_type_ids)[number])) {
      set.delete(trap as (typeof selectedEntry.trap_type_ids)[number]);
    } else {
      set.add(trap as (typeof selectedEntry.trap_type_ids)[number]);
    }
    if (set.size === 0) return;
    updateEntry({ trap_type_ids: [...set] });
  }

  if (!selectedEntry) {
    return (
      <p className="text-sm text-[var(--qs-text-muted)]" data-testid="distractor-editor-empty">
        No distractor metadata for choice {selectedLabel}.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="distractor-causality-editor">
      {showRail ? (
        <nav
          className="flex flex-wrap gap-2 border-t border-[var(--qs-border)] pt-3"
          aria-label="Wrong choice rail"
          data-testid="distractor-choice-rail"
        >
          {wrongLabels.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onSelectLabel(label)}
              className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium ${
                label === selectedLabel
                  ? "bg-[var(--qs-phase-candidates)] text-white"
                  : "border border-[var(--qs-border)] bg-[var(--qs-canvas)]"
              }`}
              data-testid={`distractor-rail-${label}`}
            >
              {label}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]">Choice</label>
            <p className="text-stem mt-1 rounded-md border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-2">
              {choiceText}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--qs-text-muted)]" htmlFor="distractor-mech">
              Mechanism (MECH)
            </label>
            <select
              id="distractor-mech"
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
              value={selectedEntry.mechanism_id}
              onChange={(e) => updateEntry({ mechanism_id: e.target.value as typeof selectedEntry.mechanism_id })}
              data-testid="distractor-field-mechanism"
            >
              {MECHANISM_IDS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]" htmlFor="distractor-misconception">
              Misconception
            </label>
            <input
              id="distractor-misconception"
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
              value={selectedEntry.misconception_id}
              onChange={(e) => updateEntry({ misconception_id: e.target.value })}
              data-testid="distractor-field-misconception"
            />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]">Trap type</span>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="distractor-field-trap-types">
              {TRAP_TYPE_IDS.map((trap) => {
                const on = selectedEntry.trap_type_ids.includes(trap);
                return (
                  <button
                    key={trap}
                    type="button"
                    onClick={() => toggleTrap(trap)}
                    className={`rounded-md px-2 py-1 text-xs ${
                      on ? "bg-[var(--qs-phase-candidates)] text-white" : "border border-[var(--qs-border)]"
                    }`}
                    aria-pressed={on}
                  >
                    {trap}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]" htmlFor="distractor-likely-mistake">
              Likely mistake
            </label>
            <textarea
              id="distractor-likely-mistake"
              className="mt-1 min-h-[72px] w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
              value={selectedEntry.steps[0]?.student_action ?? ""}
              onChange={(e) => updateStep(1, e.target.value)}
              data-testid="distractor-field-likely-mistake"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]" htmlFor="distractor-why-attractive">
              Why attractive
            </label>
            <textarea
              id="distractor-why-attractive"
              className="mt-1 min-h-[72px] w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
              value={selectedEntry.validator_note ?? ""}
              onChange={(e) => updateEntry({ validator_note: e.target.value })}
              data-testid="distractor-field-why-attractive"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]" htmlFor="distractor-produces">
              Process outcome (produces value)
            </label>
            <input
              id="distractor-produces"
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-2 text-sm"
              value={selectedEntry.produces_value}
              onChange={(e) => updateEntry({ produces_value: e.target.value })}
              data-testid="distractor-field-produces-value"
            />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase text-[var(--qs-text-muted)]">Process / error path</span>
            <ul className="mt-2 space-y-2">
              {selectedEntry.steps.map((step) => (
                <li key={step.order}>
                  <label className="text-xs text-[var(--qs-text-muted)]">Step {step.order}</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-[var(--qs-border)] p-2 text-sm"
                    value={step.student_action}
                    onChange={(e) => updateStep(step.order, e.target.value)}
                    data-testid={`distractor-error-step-${step.order}`}
                  />
                </li>
              ))}
            </ul>
            {selectedEntry.steps.length < 3 ? (
              <button
                type="button"
                className="mt-2 text-sm underline"
                onClick={addStep}
              >
                Add error-path step
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <aside
        className="rounded-md border border-[var(--qs-border)] bg-[var(--qs-canvas)] p-3 text-sm"
        data-testid="distractor-causality-status"
      >
        <h3 className="font-semibold">Causality status</h3>
        <p className="mt-1">
          {selectedFinding
            ? causalityStatusLabel[selectedFinding.state] ?? selectedFinding.state
            : "Not evaluated"}
        </p>
        {selectedFinding?.message ? (
          <p className="mt-1 text-[var(--qs-text-muted)]" data-testid="distractor-causality-evidence">
            {selectedFinding.message}
            {selectedFinding.computed_value ? ` · computed: ${selectedFinding.computed_value}` : ""}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
