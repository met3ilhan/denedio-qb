import {
  OpenRouterInsufficientCreditsError,
  OpenRouterRequestError,
  OpenRouterRetryExhaustedError,
  classifyOpenRouterHttpError,
  isOpenRouterInsufficientCreditsResponse,
} from "./errors";

export type OpenRouterRetryConfig = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  fetchImpl?: typeof fetch;
};

function isTransientFetchError(cause: unknown): boolean {
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

function parseRetryAfterMs(response: Response): number | undefined {
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

async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exp = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
  return withJitter(exp);
}

export async function fetchOpenRouterWithRetry(
  url: string,
  init: RequestInit,
  stageLabel: string,
  config: OpenRouterRetryConfig = {},
): Promise<Response> {
  const maxAttempts = config.maxAttempts ?? 3;
  const baseDelayMs = config.baseDelayMs ?? 800;
  const maxDelayMs = config.maxDelayMs ?? 8_000;
  const fetchImpl = config.fetchImpl ?? fetch;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchImpl(url, init);

      if (response.ok) {
        return response;
      }

      const detail = await response.text().catch(() => "");
      const message = `${stageLabel} HTTP ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`;

      if (isOpenRouterInsufficientCreditsResponse(response.status, detail)) {
        throw new OpenRouterInsufficientCreditsError(stageLabel, response.status, message);
      }

      const { code, retryable } = classifyOpenRouterHttpError(response.status, detail);

      if (retryable && attempt < maxAttempts) {
        const retryAfter = parseRetryAfterMs(response);
        const delayMs = retryAfter ?? backoffDelayMs(attempt, baseDelayMs, maxDelayMs);
        await sleepMs(delayMs);
        lastError = new OpenRouterRequestError(message, stageLabel, response.status, code, true);
        continue;
      }

      throw new OpenRouterRequestError(message, stageLabel, response.status, code, retryable);
    } catch (cause) {
      if (cause instanceof OpenRouterInsufficientCreditsError) {
        throw cause;
      }

      if (cause instanceof OpenRouterRequestError) {
        lastError = cause;
        if (!cause.retryable || attempt >= maxAttempts) {
          if (cause.retryable && attempt >= maxAttempts) {
            throw new OpenRouterRetryExhaustedError(stageLabel, cause);
          }
          throw cause;
        }
        continue;
      }

      const message = `${stageLabel} network error: ${cause instanceof Error ? cause.message : String(cause)}`;
      const retryable = isTransientFetchError(cause);

      if (retryable && attempt < maxAttempts) {
        const delayMs = backoffDelayMs(attempt, baseDelayMs, maxDelayMs);
        await sleepMs(delayMs);
        lastError = new Error(message);
        continue;
      }

      if (retryable && attempt >= maxAttempts) {
        throw new OpenRouterRetryExhaustedError(stageLabel, new Error(message));
      }

      throw new Error(message);
    }
  }

  throw new OpenRouterRetryExhaustedError(stageLabel, lastError ?? new Error("unknown OpenRouter failure"));
}
