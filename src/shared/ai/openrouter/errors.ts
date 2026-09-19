export type OpenRouterErrorCode =
  | "AUTH_ERROR"
  | "INSUFFICIENT_CREDITS"
  | "RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT"
  | "INVALID_REQUEST"
  | "STRUCTURED_OUTPUT_INVALID"
  | "CONTENT_REFUSAL"
  | "UNKNOWN";

export class OpenRouterRequestError extends Error {
  readonly retryable: boolean;
  readonly code: OpenRouterErrorCode;

  constructor(
    message: string,
    readonly stageLabel: string,
    readonly httpStatus?: number,
    code: OpenRouterErrorCode = "UNKNOWN",
    retryable = false,
  ) {
    super(message);
    this.name = "OpenRouterRequestError";
    this.code = code;
    this.retryable = retryable;
  }
}

export class OpenRouterInsufficientCreditsError extends Error {
  readonly code = "INSUFFICIENT_CREDITS" as const;

  constructor(
    readonly stageLabel: string,
    readonly httpStatus: number | undefined,
    detail: string,
  ) {
    super(`${stageLabel}: INSUFFICIENT_CREDITS${detail ? ` — ${detail.slice(0, 500)}` : ""}`);
    this.name = "OpenRouterInsufficientCreditsError";
  }
}

export class OpenRouterRetryExhaustedError extends Error {
  constructor(
    readonly stageLabel: string,
    readonly lastError: Error,
  ) {
    super(`${stageLabel}: transient OpenRouter failures exhausted after retries`);
    this.name = "OpenRouterRetryExhaustedError";
  }
}

export function isOpenRouterInsufficientCreditsResponse(status: number, responseBody: string): boolean {
  const body = responseBody.trim();
  if (!body) {
    return status === 402;
  }
  const lower = body.toLowerCase();
  if (status === 402) {
    return true;
  }
  if (/insufficient credits?|credit balance|not enough credits|payment required/i.test(body)) {
    return true;
  }
  if (/requires more credits|add credits|top up/i.test(body)) {
    return true;
  }
  if (lower.includes("insufficient_quota") && lower.includes("credit")) {
    return true;
  }
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; code?: string } };
    const msg = parsed?.error?.message ?? "";
    if (/credit|balance|payment/i.test(msg)) {
      return true;
    }
  } catch {
    /* non-JSON */
  }
  return false;
}

export function classifyOpenRouterHttpError(
  status: number,
  responseBody: string,
): { code: OpenRouterErrorCode; retryable: boolean } {
  if (isOpenRouterInsufficientCreditsResponse(status, responseBody)) {
    return { code: "INSUFFICIENT_CREDITS", retryable: false };
  }
  if (status === 401 || status === 403) {
    return { code: "AUTH_ERROR", retryable: false };
  }
  if (status === 429) {
    return { code: "RATE_LIMIT", retryable: true };
  }
  if (status >= 500 && status <= 599) {
    return { code: "PROVIDER_UNAVAILABLE", retryable: true };
  }
  if (status === 400) {
    return { code: "INVALID_REQUEST", retryable: false };
  }
  if (status === 408 || status === 504) {
    return { code: "TIMEOUT", retryable: true };
  }
  return { code: "UNKNOWN", retryable: false };
}
