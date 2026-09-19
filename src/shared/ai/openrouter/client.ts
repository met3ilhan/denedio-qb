import { resolveProviderMode } from "../provider-mode";
import { fetchOpenRouterWithRetry } from "./retry";
import { parseOpenRouterUsage, type OpenRouterUsageTelemetry } from "./usage";
import {
  OpenRouterRequestError,
  type OpenRouterErrorCode,
} from "./errors";

export const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

export function defaultOpenRouterModelId(): string {
  return (
    process.env.QUESTION_STUDIO_OPENROUTER_MODEL?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    "openai/gpt-5.6-luna"
  );
}

export function requireLiveMode(providerClassName: string): void {
  if (resolveProviderMode() !== "LIVE") {
    throw new Error(`${providerClassName} invoked outside LIVE provider mode`);
  }
}

export type OpenRouterTextPart = { type: "text"; text: string };
export type OpenRouterImagePart = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type OpenRouterContentPart = OpenRouterTextPart | OpenRouterImagePart;

export type OpenRouterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
};

export type OpenRouterCompletionResult = {
  content: string;
  finishReason?: string;
  usage?: OpenRouterUsageTelemetry;
  requestedModel: string;
  actualModel?: string;
};

type OpenRouterResponseBody = {
  id?: string;
  model?: string;
  provider?: string;
  choices?: Array<{
    message?: { content?: string | null; refusal?: string | null };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    reasoning_tokens?: number;
    cached_tokens?: number;
    cost?: number;
  };
  error?: { message?: string; code?: string };
};

export function extractJsonObject(text: string, stageLabel: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* fall through */
    }
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new OpenRouterRequestError(
      `${stageLabel} response did not contain JSON object`,
      stageLabel,
      undefined,
      "STRUCTURED_OUTPUT_INVALID",
    );
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new OpenRouterRequestError(
      `${stageLabel} returned invalid JSON`,
      stageLabel,
      undefined,
      "STRUCTURED_OUTPUT_INVALID",
    );
  }
}

export async function openRouterChatCompletion(options: {
  apiKey: string;
  modelId: string;
  messages: OpenRouterChatMessage[];
  stageLabel: string;
  jsonObject?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<OpenRouterCompletionResult> {
  const body: Record<string, unknown> = {
    model: options.modelId,
    messages: options.messages,
  };
  if (options.jsonObject) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetchOpenRouterWithRetry(
    OPENROUTER_CHAT_COMPLETIONS_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    options.stageLabel,
    { fetchImpl: options.fetchImpl },
  );

  const json = (await response.json()) as OpenRouterResponseBody;

  if (json.error?.message) {
    throw new OpenRouterRequestError(
      `${options.stageLabel}: ${json.error.message}`,
      options.stageLabel,
      response.status,
      "UNKNOWN",
    );
  }

  const choice = json.choices?.[0];
  const refusal = choice?.message?.refusal?.trim();
  if (refusal) {
    throw new OpenRouterRequestError(
      `${options.stageLabel}: content refusal — ${refusal.slice(0, 200)}`,
      options.stageLabel,
      undefined,
      "CONTENT_REFUSAL",
    );
  }

  const rawContent: unknown = choice?.message?.content;
  let content = "";
  if (typeof rawContent === "string") {
    content = rawContent.trim();
  } else if (Array.isArray(rawContent)) {
    content = rawContent
      .map((part: unknown) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text?: string }).text ?? "")
          : "",
      )
      .join("")
      .trim();
  }

  if (!content) {
    throw new OpenRouterRequestError(
      `${options.stageLabel} returned empty content`,
      options.stageLabel,
      undefined,
      "STRUCTURED_OUTPUT_INVALID",
    );
  }

  const usage = parseOpenRouterUsage(json.usage, {
    requestedModel: options.modelId,
    actualModel: json.model,
    openRouterProvider: json.provider,
  });

  return {
    content,
    finishReason: choice?.finish_reason,
    usage,
    requestedModel: options.modelId,
    actualModel: json.model,
  };
}

export async function openRouterGenerateJson(options: {
  apiKey: string;
  modelId: string;
  prompt: string;
  stageLabel: string;
  inlineImage?: { mimeType: string; base64: string };
  systemPrompt?: string;
}): Promise<{ parsed: unknown; usage?: OpenRouterUsageTelemetry; actualModel?: string }> {
  const userContent: OpenRouterContentPart[] = [{ type: "text", text: options.prompt }];
  if (options.inlineImage) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${options.inlineImage.mimeType};base64,${options.inlineImage.base64}`,
      },
    });
  }

  const messages: OpenRouterChatMessage[] = [];
  if (options.systemPrompt?.trim()) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: userContent });

  const result = await openRouterChatCompletion({
    apiKey: options.apiKey,
    modelId: options.modelId,
    messages,
    stageLabel: options.stageLabel,
    jsonObject: true,
  });

  return {
    parsed: extractJsonObject(result.content, options.stageLabel),
    usage: result.usage,
    actualModel: result.actualModel,
  };
}

export function openRouterErrorCode(error: unknown): OpenRouterErrorCode | undefined {
  if (error instanceof OpenRouterRequestError) {
    return error.code;
  }
  return undefined;
}
