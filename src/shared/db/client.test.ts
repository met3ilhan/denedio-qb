import { afterEach, describe, expect, it, vi } from "vitest";

describe("question studio database guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects DATABASE_URL values that target Denedio", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@denedio-prod.example.com:5432/app");
    await expect(import("./client")).rejects.toThrow(/must not target Denedio/i);
  });
});
