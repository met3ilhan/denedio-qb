import { MockSolverProvider } from "./mock-provider";

export type { ISolverProvider, SolverInput } from "./types";
export { toSolverInput } from "./types";
export { MockSolverProvider } from "./mock-provider";

export function createSolverProvider() {
  return new MockSolverProvider();
}

export function solverProviderConfigHash(provider: { providerId: string; modelId: string }): string {
  return `${provider.providerId}:${provider.modelId}:independent`;
}
