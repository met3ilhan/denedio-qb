"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { BlockReviewLayer, SourceExtraction } from "@/shared/validation/source-extraction";

import { IntakeThreePanel } from "./IntakeThreePanel";

const LAYER_LABEL: Record<BlockReviewLayer, string> = {
  visible_fact: "Visible facts",
  inference: "Inference",
  uncertainty: "Uncertainty",
};

const LAYER_CLASS: Record<BlockReviewLayer, string> = {
  visible_fact: "border-l-4 border-emerald-500",
  inference: "border-l-4 border-amber-500",
  uncertainty: "border-l-4 border-rose-500",
};

export function StructuredReviewPanel({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [extraction, setExtraction] = useState<SourceExtraction | null>(null);
  const [blockLayers, setBlockLayers] = useState<Record<string, BlockReviewLayer>>({});
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sources/${sourceId}/structured`);
    if (!res.ok) return;
    const json = (await res.json()) as {
      extraction: SourceExtraction;
      analystMeta?: { blockLayers?: Record<string, BlockReviewLayer> };
    };
    setExtraction(json.extraction);
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

  return (
    <IntakeThreePanel
      navigator={
        <div className="space-y-2 text-sm" data-testid="source-preview-pane">
          <p className="font-semibold">Source preview</p>
          <p className="text-xs text-[var(--qs-text-muted)]">
            Page 1 · text preview (full viewer in later gate)
          </p>
          <p className="rounded bg-[var(--qs-canvas)] p-2 text-xs leading-relaxed">
            {extraction?.stemText ?? "Loading structured extraction…"}
          </p>
        </div>
      }
      main={
        <div className="space-y-4" data-testid="structured-review-main">
          <h2 className="text-sm font-semibold">Structured blocks</h2>
          {(Object.keys(LAYER_LABEL) as BlockReviewLayer[]).map((layer) => (
            <div key={layer} data-testid={`review-layer-${layer}`}>
              <h3 className="font-mono text-[10px] uppercase tracking-wide text-[var(--qs-text-muted)]">
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
                      <span className="font-mono text-[10px] text-[var(--qs-text-muted)]">
                        {block.type}
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
          <p className="font-semibold">Block inspector</p>
          {focused ? (
            <>
              <p className="text-xs text-[var(--qs-text-muted)]">
                Confidence {(focused.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs">
                Layer: {LAYER_LABEL[blockLayers[focused.blockId] ?? "uncertainty"]}
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
          <div className="flex flex-col gap-2 pt-4">
            <button
              type="button"
              className="rounded-md bg-[var(--qs-phase-intake)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={submitting || !extraction}
              onClick={() => void onAccept()}
              data-testid="accept-extraction"
            >
              Accept extraction
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--qs-border)] px-3 py-2 text-sm"
              disabled={submitting}
              onClick={() => void onReject()}
              data-testid="reject-extraction"
            >
              Reject · back to queue
            </button>
            <Link href={`/sources/${sourceId}/extraction`} className="text-xs underline">
              View job timeline
            </Link>
          </div>
        </div>
      }
    />
  );
}
