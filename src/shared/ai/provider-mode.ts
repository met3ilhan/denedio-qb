import { createHash } from "node:crypto";

export type ProviderMode = "LIVE" | "DEMO" | "MOCK" | "MANUAL";

const MODES: ProviderMode[] = ["LIVE", "DEMO", "MOCK", "MANUAL"];

function parseMode(raw: string | undefined): ProviderMode | undefined {
  if (!raw?.trim()) return undefined;
  const upper = raw.trim().toUpperCase() as ProviderMode;
  return MODES.includes(upper) ? upper : undefined;
}

function legacyDemoFlag(): boolean | undefined {
  const flag =
    process.env.NEXT_PUBLIC_QUESTION_STUDIO_DEMO_MODE ??
    process.env.QUESTION_STUDIO_DEMO_MODE;
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  return undefined;
}

/** Single source of truth for analyst / generation execution mode. */
export function resolveProviderMode(): ProviderMode {
  const explicit = parseMode(process.env.QUESTION_STUDIO_PROVIDER_MODE);
  if (explicit) return explicit;

  const legacy = legacyDemoFlag();
  if (legacy === false) {
    return "LIVE";
  }

  // Local default: deterministic MOCK tied to user bytes — not silent demo fixtures.
  return "MOCK";
}

/** True only when the product runs the explicit demo-fixture pipeline (not MOCK). */
export function isDemoMode(): boolean {
  return resolveProviderMode() === "DEMO";
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.QUESTION_STUDIO_GEMINI_API_KEY?.trim());
}

/** Demo kayak fixture only for deliberately marked demo samples. */
export function isExplicitDemoSource(input: {
  originalFilename: string;
  subjectHint?: string | null;
  notes?: string | null;
}): boolean {
  const name = input.originalFilename.toLowerCase();
  if (name.includes("demo") || name.includes("örnek") || name.includes("ornek")) {
    return true;
  }
  const hint = `${input.subjectHint ?? ""} ${input.notes ?? ""}`.toLowerCase();
  return hint.includes("demo-fixture") || hint.includes("demo fixture");
}

export const CANARY_MARKER_RE = /DENEDIO-CANARY-\d+/;

export function extractCanaryMarker(bytes: Buffer): string | null {
  const text = bytes.toString("utf8");
  const match = text.match(CANARY_MARKER_RE);
  return match?.[0] ?? null;
}

export function inputBytesSha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
