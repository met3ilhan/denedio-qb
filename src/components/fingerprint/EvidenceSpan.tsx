type EvidenceSpanProps = {
  dimensionKey: string;
  excerpt: string;
  blockId?: string;
  active?: boolean;
  onSelect?: () => void;
};

export function EvidenceSpan({
  dimensionKey,
  excerpt,
  blockId,
  active = false,
  onSelect,
}: EvidenceSpanProps) {
  const Tag = onSelect ? "button" : "div";

  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
        active
          ? "border-[var(--qs-phase-mechanism)] bg-[var(--qs-phase-mechanism-50)]"
          : "border-[var(--qs-border)] bg-[var(--qs-surface)] hover:bg-[var(--qs-canvas)]"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--qs-text-muted)]">
        {dimensionKey}
        {blockId ? ` · ${blockId}` : ""}
      </p>
      <p className="text-body mt-1 line-clamp-3 text-[var(--qs-text)]">{excerpt}</p>
    </Tag>
  );
}
