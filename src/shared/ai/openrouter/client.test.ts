import { afterEach, describe, expect, it, vi } from "vitest";

import { openRouterChatCompletion } from "./client";
import { parseOpenRouterUsage as parseUsage } from "./usage";

describe("openRouterChatCompletion", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  it("parses structured JSON content and usage", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "openai/gpt-5.6-luna",
          provider: "OpenAI",
          choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }],
          usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16, cost: 0.0001 },
        }),
        { status: 200 },
      ),
    );

    const result = await openRouterChatCompletion({
      apiKey: "test-key",
      modelId: "openai/gpt-5.6-luna",
      messages: [{ role: "user", content: "ping" }],
      stageLabel: "OpenRouter smoke",
      jsonObject: true,
      fetchImpl,
    });

    expect(result.content).toContain('"ok"');
    expect(result.usage?.promptTokens).toBe(12);
    expect(result.usage?.requestCostUsd).toBe(0.0001);
    expect(result.actualModel).toBe("openai/gpt-5.6-luna");

    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(headers.Authorization).not.toContain("sk-live");
  });

  it("classifies insufficient credits", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Insufficient credits" } }), { status: 402 }),
    );

    await expect(
      openRouterChatCompletion({
        apiKey: "test-key",
        modelId: "openai/gpt-5.6-luna",
        messages: [{ role: "user", content: "ping" }],
        stageLabel: "OpenRouter smoke",
        fetchImpl,
      }),
    ).rejects.toThrow(/INSUFFICIENT_CREDITS|402/);
  });
});

describe("parseOpenRouterUsage", () => {
  it("returns undefined when no usage and no extras", () => {
    expect(parseUsage(undefined, { requestedModel: "openai/gpt-5.6-luna" })).toBeUndefined();
  });
});
