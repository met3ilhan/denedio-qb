"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { tr } from "@/shared/copy/tr";
import type { BlockReviewLayer, SourceExtraction } from "@/shared/validation/source-extraction";

import { IntakeThreePanel } from "./IntakeThreePanel";

const LAYER_LABEL: Record<BlockReviewLayer, string> = {
  visible_fact: tr.structured.layers.visible_fact,
  inference: tr.structured.layers.inference,
  uncertainty: tr.structured.layers.uncertainty,
};

const LAYER_CLASS: Record<BlockReviewLayer, string> = {
  visible_fact: "border-l-4 border-emerald-500",
  inference: "border-l-4 border-amber-500",
  uncertainty: "border-l-4 border-rose-500",
};

type SourceMeta = {
  id: string;
  originalFilename: string;
  mimeType: string;
  checksumSha256: string;
  createdAt: string;
  assetUrl: string;
};

type AnalystMeta = {
  blockLayers?: Record<string, BlockReviewLayer>;
  providerMode?: string;
  demoFixtureId?: string;
  inputBytesSha256?: string;
};

function blockTypeLabel(type: string): string {
  const key = type as keyof typeof tr.blockType;
  return tr.blockType[key] ?? type;
}

function providerModeLabel(mode: string | undefined): string {
  if (mode === "LIVE") return "Canlı AI";
  if (mode === "DEMO") return "Demo";
  if (mode === "MANUAL") return "Manuel";
  if (mode === "MOCK") return "Mock (yerel)";
  return mode ?? "—";
}

export function StructuredReviewPanel({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [extraction, setExtraction] = useState<SourceExtraction | null>(null);
  const [source, setSource] = useState<SourceMeta | null>(null);
  const [analystMeta, setAnalystMeta] = useState<AnalystMeta>({});
  const [providerId, setProviderId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [blockLayers, setBlockLayers] = useState<Record<string, BlockReviewLayer>>({});
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sources/${sourceId}/structured`);
    if (!res.ok) return;
    const json = (await res.json()) as {
      extraction: SourceExtraction;
      analystMeta?: AnalystMeta;
      source?: SourceMeta;
      providerId?: string;
      modelId?: string;
    };
    setExtraction(json.extraction);
    setSource(json.source ?? null);
    setAnalystMeta(json.analystMeta ?? {});
    setProviderId(json.providerId ?? null);
    setModelId(json.modelId ?? null);
    setBlockLayers(json.analystMeta?.blockLayers ?? {});
    if (!focusedBlockId && json.extraction.blocks[0]) {
      setFocusedBlockId(json.extraction.blocks[0].blockId);
    }
  }, [sourceId, focusedBlockId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onAccept() {
    setSubmitting(true);
    await fetch(`/api/sources/${sourceId}/structured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setSubmitting(false);
    router.push(`/sources/${sourceId}/fingerprint/draft`);
  }

  async function onReject() {
    setSubmitting(true);
    await fetch(`/api/sources/${sourceId}/structured`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", defectTags: ["layout_mismatch"] }),
    });
    setSubmitting(false);
    router.push(`/sources/${sourceId}/extraction`);
  }

  const focused = extraction?.blocks.find((b) => b.blockId === focusedBlockId);

  const grouped: Record<BlockReviewLayer, SourceExtraction["blocks"]> = {
    visible_fact: [],
    inference: [],
    uncertainty: [],
  };

  if (extraction) {
    for (const block of extraction.blocks) {
      const layer = blockLayers[block.blockId] ?? "uncertainty";
      grouped[layer].push(block);
    }
  }

  const isImage = source?.mimeType.startsWith("image/");

  return (
    <IntakeThreePanel
      navigator={
        <div className="space-y-3 text-sm" data-testid="source-preview-pane">
          <p className="font-semibold">{tr.structured.previewTitle}</p>
          <p className="text-xs text-[var(--qs-text-muted)]">{tr.structured.previewHint}</p>
          {source ? (
            <dl className="space-y-1 text-xs text-[var(--qs-text-muted)]">
              <div>
                <dt className="inline font-medium">{tr.structured.fileName}: </dt>
                <dd className="inline" data-testid="source-filename">
                  {source.originalFilename}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">{tr.structured.uploadedAt}: </dt>
                <dd className="inline">{new Date(source.createdAt).toLocaleString("tr-TR")}</dd>
              </div>
            </dl>
          ) : null}
          {source && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={source.assetUrl}
              alt={tr.upload.previewAlt}
              className="max-h-80 w-full rounded border border-[var(--qs-border)] object-contain bg-white"
              data-testid="structured-source-image"
            />
          ) : source ? (
            <a
              href={source.assetUrl}
              className="text-xs text-[var(--qs-phase-intake)] underline"
              data-testid="structured-source-download"
            >
              {source.originalFilename}
            </a>
          ) : null}
          <div className="rounded bg-[var(--qs-canvas)] p-2 text-xs leading-relaxed">
            <p className="mb-1 font-medium">{tr.structured.layers.visible_fact} · soru kökü</p>
            <p data-testid="structured-stem-preview">{extraction?.stemText ?? tr.structured.loading}</p>
          </div>
        </div>
      }
      main={
        <div className="space-y-4" data-testid="structured-review-main">
          <h2 className="text-sm font-semibold">{tr.structured.blocksTitle}</h2>
          {(Object.keys(LAYER_LABEL) as BlockReviewLayer[]).map((layer) => (
            <div key={layer} data-testid={`review-layer-${layer}`}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--qs-text-muted)]">
                {LAYER_LABEL[layer]}
              </h3>
              <ul className="mt-1 space-y-1">
                {grouped[layer].map((block) => (
                  <li key={block.blockId}>
                    <button
                      type="button"
                      className={`w-full rounded-md px-2 py-2 text-left text-sm ${LAYER_CLASS[layer]} ${
                        focusedBlockId === block.blockId ? "bg-[var(--qs-canvas)]" : ""
                      }`}
                      onClick={() => setFocusedBlockId(block.blockId)}
                      data-testid={`block-${block.blockId}`}
                    >
                      <span className="text-[10px] text-[var(--qs-text-muted)]">
                        {blockTypeLabel(block.type)}
                        {block.choiceLabel ? ` · ${block.choiceLabel}` : ""}
                      </span>
                      <p className="mt-1 line-clamp-2">{block.text}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      }
      inspector={
        <div className="space-y-3 text-sm" data-testid="structured-inspector">
          <p className="font-semibold">{tr.structured.inspector}</p>
          <p className="text-xs" data-testid="execution-mode-label">
            {tr.structured.executionMode}:{" "}
            <span className="font-medium">{providerModeLabel(analystMeta.providerMode)}</span>
          </p>
          {analystMeta.demoFixtureId ? (
            <p className="text-xs text-amber-800" data-testid="demo-fixture-id">
              Demo örneği: {analystMeta.demoFixtureId}
            </p>
          ) : null}
          {focused ? (
            <>
              <p className="text-xs text-[var(--qs-text-muted)]">
                {tr.structured.confidence((focused.confidence * 100).toFixed(0))}
              </p>
              <p className="text-xs">
                {tr.structured.layer(LAYER_LABEL[blockLayers[focused.blockId] ?? "uncertainty"])}
              </p>
            </>
          ) : null}
          {extraction?.extractionWarnings?.length ? (
            <ul className="text-xs text-amber-700">
              {extraction.extractionWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="text-xs underline text-[var(--qs-text-muted)]"
            onClick={() => setShowTechnical((v) => !v)}
          >
            {tr.structured.technicalDetails}
          </button>
          {showTechnical ? (
            <dl className="space-y-1 text-[10px] text-[var(--qs-text-muted)]">
              <div>
                <dt>{tr.structured.providerLabel}</dt>
                <dd>
                  {providerId}/{modelId}
                </dd>
              </div>
              {source ? (
                <div>
                  <dt>{tr.structured.checksum}</dt>
                  <dd className="break-all">{source.checksumSha256}</dd>
                </div>
              ) : null}
              {analystMeta.inputBytesSha256 ? (
                <div>
                  <dt>Girdi SHA256</dt>
                  <dd className="break-all">{analystMeta.inputBytesSha256}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <div className="flex flex-col gap-2 pt-4">
            <button
              type="button"
              className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={submitting || !extraction}
              onClick={() => void onAccept()}
              data-testid="accept-extraction"
            >
              {tr.structured.accept}
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              disabled={submitting}
              onClick={() => void onReject()}
              data-testid="reject-extraction"
            >
              {tr.structured.reject}
            </button>
            <Link href={`/sources/${sourceId}/extraction`} className="text-xs underline">
              {tr.structured.viewTimeline}
            </Link>
          </div>
        </div>
      }
    />
  );
}
