import { MockDistractorAnalysisProvider } from "./mock-provider";

export type { IDistractorAnalysisProvider } from "./types";
export { MockDistractorAnalysisProvider } from "./mock-provider";

export function createDistractorAnalysisProvider() {
  return new MockDistractorAnalysisProvider();
}
