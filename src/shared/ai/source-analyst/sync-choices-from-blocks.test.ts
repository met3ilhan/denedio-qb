import { describe, expect, it } from "vitest";

import { syncChoicesFromBlocks } from "./sync-choices-from-blocks";

describe("syncChoicesFromBlocks", () => {
  it("restores missing E choice from blocks", () => {
    const merged = syncChoicesFromBlocks({
      choices: [
        { label: "A", text: "Ahidnâme" },
        { label: "B", text: "Amannâme" },
        { label: "C", text: "Adaletnâme", isCorrect: true },
        { label: "D", text: "Berat" },
      ],
      blocks: [
        { blockId: "stem", type: "stem", text: "Soru?", confidence: 1, page: 1 },
        { blockId: "c-a", type: "choice", choiceLabel: "A", text: "Ahidnâme", confidence: 1, page: 1 },
        { blockId: "c-e", type: "choice", choiceLabel: "E", text: "Ferman", confidence: 1, page: 1 },
      ],
    });
    expect(merged).toHaveLength(5);
    expect(merged.find((c) => c.label === "E")?.text).toBe("Ferman");
  });
});
