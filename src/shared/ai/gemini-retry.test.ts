import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { extractJsonObject, geminiGenerateTextJson } from "./gemini-client";
import * as geminiRetry from "./gemini-retry";
import {
  fetchGeminiWithRetry,
  GeminiRequestError,
  GeminiRetryExhaustedError,
} from "./gemini-retry";

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("fetchGeminiWithRetry", () => {
  beforeEach(() => {
    vi.spyOn(geminiRetry, "sleepMs").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries 503 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "busy" }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    const res = await fetchGeminiWithRetry(
      "https://example.test/gemini",
      { method: "POST" },
      "Gemini test stage",
      { fetchImpl, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries 503 twice then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    const res = await fetchGeminiWithRetry(
      "https://example.test/gemini",
      { method: "POST" },
      "Gemini test stage",
      { fetchImpl, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("retries 429 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429, { "retry-after": "1" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    await fetchGeminiWithRetry(
      "https://example.test/gemini",
      { method: "POST" },
      "Gemini test stage",
      { fetchImpl, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries network transient then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    await fetchGeminiWithRetry(
      "https://example.test/gemini",
      { method: "POST" },
      "Gemini test stage",
      { fetchImpl, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails honestly after exhausted 503 retries", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "busy" }, 503));

    await expect(
      fetchGeminiWithRetry(
        "https://example.test/gemini",
        { method: "POST" },
        "Gemini test stage",
        { fetchImpl, baseDelayMs: 1, maxDelayMs: 2, maxAttempts: 3 },
      ),
    ).rejects.toBeInstanceOf(GeminiRetryExhaustedError);

    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry HTTP 401", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "auth" }, 401));

    await expect(
      fetchGeminiWithRetry(
        "https://example.test/gemini",
        { method: "POST" },
        "Gemini test stage",
        { fetchImpl },
      ),
    ).rejects.toMatchObject({ httpStatus: 401, retryable: false } satisfies Partial<GeminiRequestError>);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not retry HTTP 400", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: "bad" }, 400));

    await expect(
      fetchGeminiWithRetry(
        "https://example.test/gemini",
        { method: "POST" },
        "Gemini test stage",
        { fetchImpl },
      ),
    ).rejects.toBeInstanceOf(GeminiRequestError);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("invokes onRetry for transient attempts", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
    const onRetry = vi.fn();

    await fetchGeminiWithRetry(
      "https://example.test/gemini",
      { method: "POST" },
      "Gemini test stage",
      { fetchImpl, onRetry, baseDelayMs: 1, maxDelayMs: 2 },
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0]?.[0]).toMatchObject({ attempt: 1, maxAttempts: 3 });
  });

  it("returns once per product call despite transport retries (no duplicate completion)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
        }),
      );

    vi.spyOn(globalThis, "fetch").mockImplementation(fetchImpl as typeof fetch);

    const text = await geminiGenerateTextJson({
      apiKey: "test-key",
      modelId: "gemini-test",
      prompt: "hello",
      stageLabel: "Gemini question generator",
    });

    expect(text).toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("geminiGenerateTextJson transport vs schema", () => {
  beforeEach(() => {
    vi.spyOn(geminiRetry, "sleepMs").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not transport-retry schema validation errors after a successful HTTP response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: "not json at all" }] } }],
      }),
    );

    vi.spyOn(globalThis, "fetch").mockImplementation(fetchImpl as typeof fetch);

    const text = await geminiGenerateTextJson({
      apiKey: "test-key",
      modelId: "gemini-test",
      prompt: "hello",
      stageLabel: "Gemini question generator",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(() => extractJsonObject(text, "Gemini question generator")).toThrow(
      /did not contain JSON object/,
    );
  });

  it("does not mock-fallback after retry exhaustion", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 503));
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchImpl as typeof fetch);

    await expect(
      geminiGenerateTextJson({
        apiKey: "test-key",
        modelId: "gemini-test",
        prompt: "hello",
        stageLabel: "Gemini question generator",
      }),
    ).rejects.toBeInstanceOf(GeminiRetryExhaustedError);
  });
});
