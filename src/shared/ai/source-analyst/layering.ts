import type { ExtractionBlock } from "@/shared/validation/source-extraction";
import type { BlockReviewLayer } from "@/shared/validation/source-extraction";

export function classifyBlockLayer(block: ExtractionBlock): BlockReviewLayer {
  if (block.confidence >= 0.92 && (block.type === "stem" || block.type === "choice")) {
    return "visible_fact";
  }
  if (block.confidence >= 0.75 || block.type === "solution") {
    return "inference";
  }
  return "uncertainty";
}

export function buildBlockLayers(blocks: ExtractionBlock[]): Record<string, BlockReviewLayer> {
  const layers: Record<string, BlockReviewLayer> = {};
  for (const block of blocks) {
    layers[block.blockId] = classifyBlockLayer(block);
  }
  return layers;
}
