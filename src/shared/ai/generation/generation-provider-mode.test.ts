import { afterEach, describe, expect, it } from "vitest";

import { createGenerationProvider, resetGenerationProviderCache } from "./index";
import { MockGenerationProvider } from "./mock-provider";
import { UnconfiguredLiveGenerationProvider } from "./unconfigured-live-provider";

describe("createGenerationProvider", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    resetGenerationProviderCache();
  });

  it("uses mock in MOCK mode without API key", () => {
    process.env.QUESTION_STUDIO_PROVIDER_MODE = "MOCK";
    delete process.env.QUESTION_STUDIO_GEMINI_API_KEY;
    const provider = createGenerationProvider();
    expect(provider).toBeInstanceOf(MockGenerationProvider);
    expect(provider.providerId).toBe("mock");
  });

  it("uses unconfigured live provider when LIVE without key", () => {
    process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.QUESTION_STUDIO_GEMINI_API_KEY;
    const provider = createGenerationProvider();
    expect(provider).toBeInstanceOf(UnconfiguredLiveGenerationProvider);
  });

  it("selects OpenRouter by default in LIVE when key present", async () => {
    process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
    delete process.env.QUESTION_STUDIO_LIVE_PROVIDER;
    process.env.OPENROUTER_API_KEY = "test-key";
    const { OpenRouterGenerationProvider } = await import("./openrouter-provider");
    const provider = createGenerationProvider();
    expect(provider).toBeInstanceOf(OpenRouterGenerationProvider);
    expect(provider.providerId).toBe("openrouter");
  });

  it("selects Gemini when LIVE provider override is gemini", async () => {
    process.env.QUESTION_STUDIO_PROVIDER_MODE = "LIVE";
    process.env.QUESTION_STUDIO_LIVE_PROVIDER = "gemini";
    process.env.QUESTION_STUDIO_GEMINI_API_KEY = "test-key";
    const { GeminiGenerationProvider } = await import("./gemini-provider");
    const provider = createGenerationProvider();
    expect(provider).toBeInstanceOf(GeminiGenerationProvider);
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(provider))).not.toContain("fallback");
  });
});
