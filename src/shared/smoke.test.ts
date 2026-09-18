import { describe, expect, it } from "vitest";
import { STUDIO_NAME } from "./index";

describe("question studio smoke", () => {
  it("exposes the studio name constant", () => {
    expect(STUDIO_NAME).toBe("Question Studio");
  });
});
