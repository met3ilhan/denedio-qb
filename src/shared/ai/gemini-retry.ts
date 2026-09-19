import { getGeminiRetryListener } from "./gemini-retry-context";

export type GeminiRetryEvent = {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  reason: string;
};

export type GeminiRetryConfig = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (event: GeminiRetryEvent) => void;
  fetchImpl?: typeof fetch;
};

export class GeminiRequestError extends Error {
  readonly retryable: boolean;

  constructor(
    message: string,
    readonly stageLabel: string,
    readonly httpStatus?: number,
    retryable = false,
  ) {
    super(message);
    this.name = "GeminiRequestError";
    this.retryable = retryable;
  }
}

export class GeminiQuotaExhaustedError extends Error {
  readonly code = "QUOTA_EXHAUSTED" as const;

  constructor(
    readonly stageLabel: string,
    readonly httpStatus: number | undefined,
    detail: string,
  ) {
    super(`${stageLabel}: QUOTA_EXHAUSTED${detail ? ` — ${detail.slice(0, 500)}` : ""}`);
    this.name = "GeminiQuotaExhaustedError";
  }
}

export class GeminiRetryExhaustedError extends Error {
  constructor(
    readonly stageLabel: string,
    readonly lastError: Error,
  ) {
    super(`${stageLabel}: transient Gemini failures exhausted after retries`);
    this.name = "GeminiRetryExhaustedError";
  }
}

/** Observed Gemini/Google API quota exhaustion (429 + RESOURCE_EXHAUSTED, QuotaFailure, etc.). */
export function isGeminiQuotaExhaustedResponse(status: number, responseBody: string): boolean {
  const body = responseBody.trim();
  if (!body) {
    return false;
  }

  const upper = body.toUpperCase();
  if (upper.includes("RESOURCE_EXHAUSTED")) {
    return true;
  }
  if (upper.includes("TYPE.GOOGLEAPIS.COM/GOOGLE.RPC.QUOTAFAILURE") || upper.includes("QUOTAFAILURE")) {
    return true;
  }
  if (/exceeded your current quota/i.test(body)) {
    return true;
  }
  if (/free[\s-]?tier.*quota/i.test(body) || /quota.*free[\s-]?tier/i.test(body)) {
    return true;
  }

  try {
    const parsed = JSON.parse(body) as {
      error?: { status?: string; code?: number; message?: string };
    };
    const err = parsed?.error;
    if (err?.status === "RESOURCE_EXHAUSTED") {
      return true;
    }
    if (err?.code === 429 && err?.status === "RESOURCE_EXHAUSTED") {
      return true;
    }
    if (typeof err?.message === "string" && /exceeded your current quota/i.test(err.message)) {
      return true;
    }
  } catch {
    /* non-JSON body — heuristics above */
  }

  return false;
}

export function isTransientHttpStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export function shouldRetryGeminiHttpStatus(status: number, responseBody: string): boolean {
  if (isGeminiQuotaExhaustedResponse(status, responseBody)) {
    return false;
  }
  return isTransientHttpStatus(status);
}

export function isTransientFetchError(cause: unknown): boolean {
  if (!(cause instanceof Error)) {
    return false;
  }
  const msg = cause.message.toLowerCase();
  const name = cause.name.toLowerCase();
  return (
    name.includes("timeout") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("econnrefused") ||
    msg.includes("socket hang up")
  );
}

export function parseRetryAfterMs(response: Response): number | undefined {
  const raw = response.headers.get("retry-after")?.trim();
  if (!raw) {
    return undefined;
  }
  const asSeconds = Number(raw);
  if (!Number.isNaN(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, 60_000);
  }
  const asDate = Date.parse(raw);
  if (!Number.isNaN(asDate)) {
    return Math.min(Math.max(0, asDate - Date.now()), 60_000);
  }
  return undefined;
}

function withJitter(ms: number): number {
  return ms + Math.floor(Math.random() * Math.max(1, ms * 0.15));
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exp = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
  return withJitter(exp);
}

export async function fetchGeminiWithRetry(
  url: string,
  init: RequestInit,
  stageLabel: string,
  config: GeminiRetryConfig = {},
): Promise<Response> {
  const maxAttempts = config.maxAttempts ?? 3;
  const baseDelayMs = config.baseDelayMs ?? 800;
  const maxDelayMs = config.maxDelayMs ?? 8_000;
  const fetchImpl = config.fetchImpl ?? fetch;
  const notifyRetry = config.onRetry ?? getGeminiRetryListener();

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchImpl(url, init);

      if (response.ok) {
        return response;
      }

      const detail = await response.text().catch(() => "");
      const message = `${stageLabel} HTTP ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`;

      if (isGeminiQuotaExhaustedResponse(response.status, detail)) {
        throw new GeminiQuotaExhaustedError(stageLabel, response.status, message);
      }

      const retryable = shouldRetryGeminiHttpStatus(response.status, detail);

      if (retryable && attempt < maxAttempts) {
        const retryAfter = parseRetryAfterMs(response);
        const delayMs = retryAfter ?? backoffDelayMs(attempt, baseDelayMs, maxDelayMs);
        notifyRetry?.({
          attempt,
          maxAttempts,
          delayMs,
          reason: `HTTP ${response.status}`,
        });
        await sleepMs(delayMs);
        lastError = new GeminiRequestError(message, stageLabel, response.status, true);
        continue;
      }

      throw new GeminiRequestError(message, stageLabel, response.status, retryable);
    } catch (cause) {
      if (cause instanceof GeminiQuotaExhaustedError) {
        throw cause;
      }

      if (cause instanceof GeminiRequestError) {
        lastError = cause;
        if (!cause.retryable || attempt >= maxAttempts) {
          if (cause.retryable && attempt >= maxAttempts) {
            throw new GeminiRetryExhaustedError(stageLabel, cause);
          }
          throw cause;
        }
        continue;
      }

      const message = `${stageLabel} network error: ${cause instanceof Error ? cause.message : String(cause)}`;
      const retryable = isTransientFetchError(cause);

      if (retryable && attempt < maxAttempts) {
        const delayMs = backoffDelayMs(attempt, baseDelayMs, maxDelayMs);
        notifyRetry?.({
          attempt,
          maxAttempts,
          delayMs,
          reason: "network",
        });
        await sleepMs(delayMs);
        lastError = new Error(message);
        continue;
      }

      if (retryable && attempt >= maxAttempts) {
        throw new GeminiRetryExhaustedError(stageLabel, new Error(message));
      }

      throw new Error(message);
    }
  }

  throw new GeminiRetryExhaustedError(stageLabel, lastError ?? new Error("unknown Gemini failure"));
}
