import { describe, expect, it } from "vitest";

import { isAllowedMimeType, resolveSourceMimeType } from "./policy";

describe("resolveSourceMimeType", () => {
  it("infers PNG when browser sends octet-stream", () => {
    expect(resolveSourceMimeType("scan.png", "application/octet-stream")).toBe("image/png");
    expect(isAllowedMimeType(resolveSourceMimeType("scan.png", ""))).toBe(true);
  });

  it("keeps trusted image/jpeg from browser", () => {
    expect(resolveSourceMimeType("photo.jpg", "image/jpeg")).toBe("image/jpeg");
  });

  it("infers jpeg extension for empty type", () => {
    expect(resolveSourceMimeType("item.JPEG", "")).toBe("image/jpeg");
  });
});
