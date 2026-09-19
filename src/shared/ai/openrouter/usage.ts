export type OpenRouterUsageTelemetry = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  requestCostUsd?: number;
  requestedModel?: string;
  actualModel?: string;
  openRouterProvider?: string;
};

export type OpenRouterUsageRaw = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  reasoning_tokens?: number;
  cached_tokens?: number;
  cost?: number;
};

export function parseOpenRouterUsage(
  usage: OpenRouterUsageRaw | undefined,
  extras: {
    requestedModel: string;
    actualModel?: string;
    openRouterProvider?: string;
  },
): OpenRouterUsageTelemetry | undefined {
  if (!usage) {
    if (!extras.actualModel && !extras.openRouterProvider) {
      return undefined;
    }
    return {
      requestedModel: extras.requestedModel,
      actualModel: extras.actualModel,
      openRouterProvider: extras.openRouterProvider,
    };
  }

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    reasoningTokens: usage.reasoning_tokens,
    cachedTokens: usage.cached_tokens,
    requestCostUsd: typeof usage.cost === "number" ? usage.cost : undefined,
    requestedModel: extras.requestedModel,
    actualModel: extras.actualModel,
    openRouterProvider: extras.openRouterProvider,
  };
}
