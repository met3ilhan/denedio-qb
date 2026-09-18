import { describe, expect, it } from "vitest";

import { partitionImportItemsByExistingKey } from "@/modules/export/import-idempotency";
import { detectDuplicateExternalKeysInBatch } from "@/modules/export/dry-run";

describe("importExternalKey idempotency", () => {
  it("partitions items like Denedio persist skip-on-existing-key", () => {
    const items = [
      { externalKey: "qs:existing-1", content: {} },
      { externalKey: "qs:new-1", content: {} },
      { externalKey: "qs:existing-1", content: {} },
    ];
    const existing = new Set(["qs:existing-1"]);
    const { toCreate, skippedExternalKeys } = partitionImportItemsByExistingKey(items, existing);
    expect(skippedExternalKeys).toEqual(["qs:existing-1", "qs:existing-1"]);
    expect(toCreate.map((i) => i.externalKey)).toEqual(["qs:new-1"]);
  });

  it("detects duplicate externalKey within batch (preview parity)", () => {
    expect(
      detectDuplicateExternalKeysInBatch(["qs:a", "qs:b", "qs:a"]),
    ).toBe("qs:a");
    expect(detectDuplicateExternalKeysInBatch(["qs:a", "qs:b"])).toBeNull();
  });
});
