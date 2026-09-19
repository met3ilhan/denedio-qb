import { afterEach, describe, expect, it } from "vitest";

import {
  defaultOpenRouterModelSlug,
  hasOpenRouterApiKey,
  resolveLiveProvider,
} from "./provider-mode";

describe("resolveLiveProvider", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to openrouter", () => {
    delete process.env.QUESTION_STUDIO_LIVE_PROVIDER;
    expect(resolveLiveProvider()).toBe("openrouter");
  });

  it("honors gemini override", () => {
    process.env.QUESTION_STUDIO_LIVE_PROVIDER = "gemini";
    expect(resolveLiveProvider()).toBe("gemini");
  });

  it("pins default OpenRouter model slug", () => {
    delete process.env.QUESTION_STUDIO_OPENROUTER_MODEL;
    delete process.env.OPENROUTER_MODEL;
    expect(defaultOpenRouterModelSlug()).toBe("openai/gpt-5.6-luna");
  });

  it("detects OpenRouter key without exposing value", () => {
    process.env.OPENROUTER_API_KEY = "sk-test";
    expect(hasOpenRouterApiKey()).toBe(true);
    delete process.env.OPENROUTER_API_KEY;
    expect(hasOpenRouterApiKey()).toBe(false);
  });
});
