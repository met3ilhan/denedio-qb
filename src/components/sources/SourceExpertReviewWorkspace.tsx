"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FINGERPRINT_DIMENSION_LABELS } from "@/shared/copy/fingerprint-labels";
import { tr } from "@/shared/copy/tr";
import type { SourceExtraction } from "@/shared/validation/source-extraction";

type SourceMeta = {
  id: string;
  originalFilename: string;
  mimeType: string;
  missionId?: string;
  createdAt: string;
  assetUrl: string;
};

type FingerprintDraft = {
  versionId: string;
  payload: Record<string, unknown>;
  gapWarnings: string[];
};

type DenedioRow = {
  field: string;
  studioValue: string;
  valueStatus: string;
  mappingStatus: string;
};

function providerModeLabel(mode: string | undefined): string {
  if (mode === "LIVE") return "Canlı AI";
  if (mode === "DEMO") return "Demo";
  if (mode === "MANUAL") return "Manuel";
  if (mode === "MOCK") return "Mock (yerel)";
  return mode ?? tr.common.undetermined;
}

function displayOrMissing(value: string | undefined | null, missing: string): string {
  const v = value?.trim();
  return v ? v : missing;
}

export function SourceExpertReviewWorkspace({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<SourceMeta | null>(null);
  const [extraction, setExtraction] = useState<SourceExtraction | null>(null);
  const [providerMode, setProviderMode] = useState<string>("");
  const [fingerprint, setFingerprint] = useState<FingerprintDraft | null>(null);
  const [subjectHint, setSubjectHint] = useState("");
  const [topicHint, setTopicHint] = useState("");
  const [subtopicHint, setSubtopicHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sources/${sourceId}/structured`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const json = (await res.json()) as {
      extraction: SourceExtraction;
      source?: SourceMeta & { missionId?: string };
      analystMeta?: { providerMode?: string };
    };
    setExtraction(json.extraction);
    setSource(json.source ?? null);
    setProviderMode(json.analystMeta?.providerMode ?? "");

    const previewRes = await fetch(`/api/sources/${sourceId}/fingerprint/preview`, { method: "POST" });
    if (previewRes.ok) {
      const previewJson = (await previewRes.json()) as {
        payload: Record<string, unknown>;
        gapWarnings?: string[];
      };
      setFingerprint({
        versionId: "",
        payload: previewJson.payload,
        gapWarnings: previewJson.gapWarnings ?? [],
      });
    }
    setLoading(false);
  }, [sourceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const correctLabel = useMemo(() => {
    return extraction?.choices.find((c) => c.isCorrect)?.label ?? "";
  }, [extraction]);

  const denedioRows: DenedioRow[] = useMemo(() => {
    const archetype = fingerprint?.payload.question_archetype as { label?: string } | undefined;
    return [
      {
        field: "Ders",
        studioValue: displayOrMissing(subjectHint, tr.common.undetermined),
        valueStatus: subjectHint ? tr.provenance.aiDerived : tr.provenance.undetermined,
        mappingStatus: tr.denedioReadiness.mappingPending,
      },
      {
        field: "Konu",
        studioValue: displayOrMissing(topicHint, tr.common.undetermined),
        valueStatus: topicHint ? tr.provenance.expertEdited : tr.provenance.undetermined,
        mappingStatus: tr.denedioReadiness.mappingPending,
      },
      {
        field: "Alt konu",
        studioValue: displayOrMissing(subtopicHint, tr.common.undetermined),
        valueStatus: subtopicHint ? tr.provenance.expertEdited : tr.provenance.undetermined,
        mappingStatus: tr.denedioReadiness.mappingPending,
      },
      {
        field: "Soru arketipi",
        studioValue: displayOrMissing(archetype?.label, tr.common.notYetEvaluated),
        valueStatus: archetype?.label ? tr.provenance.aiDerived : tr.provenance.undetermined,
        mappingStatus: tr.denedioReadiness.mappingPending,
      },
    ];
  }, [subjectHint, topicHint, subtopicHint, fingerprint?.payload]);

  function saveFingerprintField(key: string, value: string) {
    setFingerprint((prev) =>
      prev ? { ...prev, payload: { ...prev.payload, [key]: value } } : prev,
    );
  }

  async function onApproveAndGenerate() {
    if (!extraction || !source?.missionId) return;
    setBusy(true);
    setMessage(null);
    try {
      await fetch(`/api/sources/${sourceId}/structured`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", extraction }),
      });

      const draftRes = await fetch(`/api/sources/${sourceId}/fingerprint/draft`, { method: "POST" });
      if (draftRes.ok && fingerprint) {
        const draftJson = (await draftRes.json()) as { version: { id: string } };
        for (const key of [
          "measured_skill",
          "learning_objective",
          "cognitive_operation",
          "reasoning_pattern",
          "hidden_constraint",
        ] as const) {
          const value = fingerprint.payload[key];
          if (typeof value === "string" && value.trim()) {
            await fetch(`/api/fingerprint/${draftJson.version.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ [key]: value }),
            });
          }
        }
        await fetch(`/api/fingerprint/${draftJson.version.id}/lock`, { method: "POST" });
      }

      router.push(`/missions/${source.missionId}/generate/setup`);
    } catch {
      setMessage(tr.expertReview.approveFailed);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--qs-text-muted)]">{tr.structured.loading}</p>;
  }

  if (!extraction) {
    return (
      <p className="text-sm text-[var(--qs-text-muted)]">
        {tr.expertReview.extractionNotReady}{" "}
        <button type="button" className="underline" onClick={() => router.push(`/sources/${sourceId}/extraction`)}>
          {tr.extraction.page.title}
        </button>
      </p>
    );
  }

  const isImage = source?.mimeType.startsWith("image/");

  return (
    <div className="space-y-6" data-testid="source-expert-review">
      <header className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--qs-text-muted)]">
          {tr.expertReview.screenLabel}
        </p>
        <h2 className="text-xl font-semibold text-[var(--qs-text)]">{tr.expertReview.title}</h2>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
          <h3 className="text-sm font-semibold">{tr.expertReview.sourcePanel}</h3>
          {source ? (
            <dl className="mt-3 space-y-1 text-xs text-[var(--qs-text-muted)]">
              <div>
                <dt className="inline font-medium">{tr.structured.fileName}: </dt>
                <dd className="inline">{source.originalFilename}</dd>
              </div>
              <div>
                <dt className="inline font-medium">{tr.structured.executionMode}: </dt>
                <dd className="inline">{providerModeLabel(providerMode)}</dd>
              </div>
            </dl>
          ) : null}
          {source && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source.assetUrl}
              alt={source.originalFilename}
              data-testid="structured-source-image"
              className="mt-3 max-h-80 w-full rounded-md border border-[var(--qs-border)] object-contain"
            />
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
            <h3 className="text-sm font-semibold">{tr.expertReview.aiContent}</h3>
            <label className="mt-3 block text-xs font-medium text-[var(--qs-text-muted)]">
              {tr.candidates.questionStem}
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              rows={4}
              value={extraction.stemText}
              data-testid="structured-stem-preview"
              onChange={(e) => setExtraction({ ...extraction, stemText: e.target.value })}
            />
            <div className="mt-4 space-y-2">
              {extraction.choices.map((choice, idx) => (
                <div key={choice.label} className="flex flex-wrap items-center gap-2">
                  <span className="w-6 font-mono text-xs">{choice.label}</span>
                  <input
                    className="min-w-0 flex-1 rounded-md border border-[var(--qs-border)] px-2 py-1 text-sm"
                    value={choice.text}
                    onChange={(e) => {
                      const choices = [...extraction.choices];
                      choices[idx] = { ...choice, text: e.target.value };
                      setExtraction({ ...extraction, choices });
                    }}
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="radio"
                      name="correct"
                      checked={choice.isCorrect}
                      onChange={() => {
                        const choices = extraction.choices.map((c, i) => ({
                          ...c,
                          isCorrect: i === idx,
                        }));
                        setExtraction({ ...extraction, choices });
                      }}
                    />
                    {tr.candidates.markCorrect(choice.label)}
                  </label>
                </div>
              ))}
            </div>
            <label className="mt-4 block text-xs font-medium text-[var(--qs-text-muted)]">
              {tr.candidates.solution}
            </label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              rows={3}
              value={extraction.solutionText ?? ""}
              onChange={(e) => setExtraction({ ...extraction, solutionText: e.target.value })}
            />
            <p className="mt-2 text-xs text-[var(--qs-text-muted)]">
              {tr.provenance.label}: {tr.provenance.aiDerived}
              {correctLabel ? ` · ${tr.expertReview.correctAnswer}: ${correctLabel}` : ""}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
            <h3 className="text-sm font-semibold">{tr.expertReview.classification}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FieldInput label={tr.upload.subjectLabel} value={subjectHint} onChange={setSubjectHint} />
              <FieldInput label="Konu" value={topicHint} onChange={setTopicHint} missing={tr.common.undetermined} />
              <FieldInput label="Alt konu" value={subtopicHint} onChange={setSubtopicHint} missing={tr.common.undetermined} />
              <ReadOnlyField
                label={tr.candidates.difficulty}
                value={tr.common.notYetEvaluated}
                provenance={tr.provenance.undetermined}
              />
            </div>
          </div>

          {fingerprint ? (
            <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
              <h3 className="text-sm font-semibold">{tr.expertReview.pedagogicalProfile}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    "measured_skill",
                    "learning_objective",
                    "cognitive_operation",
                    "reasoning_pattern",
                    "hidden_constraint",
                  ] as const
                ).map((key) => (
                  <label key={key} className="block text-xs">
                    <span className="font-medium text-[var(--qs-text-muted)]">
                      {FINGERPRINT_DIMENSION_LABELS[key] ?? key}
                    </span>
                    <input
                      className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-1 text-sm"
                      value={String(fingerprint.payload[key] ?? "")}
                      onChange={(e) =>
                        setFingerprint({
                          ...fingerprint,
                          payload: { ...fingerprint.payload, [key]: e.target.value },
                        })
                      }
                      onBlur={(e) => void saveFingerprintField(key, e.target.value)}
                    />
                    <span className="text-[10px] text-[var(--qs-text-muted)]">{tr.provenance.aiDerived}</span>
                  </label>
                ))}
              </div>
              {fingerprint.gapWarnings.length > 0 ? (
                <ul className="mt-3 list-disc pl-5 text-xs text-amber-800">
                  {fingerprint.gapWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-[var(--qs-border)] bg-[var(--qs-surface)] p-4">
            <h3 className="text-sm font-semibold">{tr.expertReview.denedioReadiness}</h3>
            <table className="mt-3 w-full text-left text-xs">
              <thead>
                <tr className="text-[var(--qs-text-muted)]">
                  <th className="pb-2 pr-2">{tr.expertReview.fieldCol}</th>
                  <th className="pb-2 pr-2">{tr.expertReview.studioCol}</th>
                  <th className="pb-2 pr-2">{tr.expertReview.valueStatusCol}</th>
                  <th className="pb-2">{tr.expertReview.mappingCol}</th>
                </tr>
              </thead>
              <tbody>
                {denedioRows.map((row) => (
                  <tr key={row.field} className="border-t border-[var(--qs-border)]">
                    <td className="py-2 pr-2 font-medium">{row.field}</td>
                    <td className="py-2 pr-2">{row.studioValue}</td>
                    <td className="py-2 pr-2">{row.valueStatus}</td>
                    <td className="py-2">{row.mappingStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="rounded-lg border border-dashed border-[var(--qs-border)] p-3 text-xs">
            <summary className="cursor-pointer font-medium">{tr.structured.technicalDetails}</summary>
            <pre className="mt-2 overflow-auto text-[10px]">{JSON.stringify({ providerMode, sourceId }, null, 2)}</pre>
          </details>

          {message ? <p className="text-sm text-red-600">{message}</p> : null}

          <button
            type="button"
            disabled={busy}
            className="rounded-md bg-[var(--qs-phase-mechanism)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            data-testid="approve-analysis-generate"
            onClick={() => void onApproveAndGenerate()}
          >
            {busy ? tr.generation.runningPipeline : tr.expertReview.primaryCta}
          </button>
        </section>
      </div>
    </div>
  );
}

function FieldInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  missing?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="font-medium text-[var(--qs-text-muted)]">{props.label}</span>
      <input
        className="mt-1 w-full rounded-md border border-[var(--qs-border)] px-2 py-1 text-sm"
        value={props.value}
        placeholder={props.missing}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function ReadOnlyField(props: { label: string; value: string; provenance: string }) {
  return (
    <div className="text-xs">
      <span className="font-medium text-[var(--qs-text-muted)]">{props.label}</span>
      <p className="mt-1 text-sm">{props.value}</p>
      <span className="text-[10px] text-[var(--qs-text-muted)]">{props.provenance}</span>
    </div>
  );
}
