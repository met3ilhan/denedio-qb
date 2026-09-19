import { fetchGeminiWithRetry } from "./gemini-retry";
import { resolveProviderMode } from "./provider-mode";

export type GeminiGenerateOptions = {
  apiKey: string;
  modelId: string;
  prompt: string;
  /** Optional inline image for multimodal calls */
  inlineImage?: { mimeType: string; base64: string };
  stageLabel: string;
};

export function defaultGeminiModelId(): string {
  return process.env.QUESTION_STUDIO_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function solverGeminiModelId(): string {
  return (
    process.env.QUESTION_STUDIO_GEMINI_SOLVER_MODEL?.trim() ||
    process.env.QUESTION_STUDIO_GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash"
  );
}

export function requireLiveMode(providerClassName: string): void {
  if (resolveProviderMode() !== "LIVE") {
    throw new Error(`${providerClassName} invoked outside LIVE provider mode`);
  }
}

export async function geminiGenerateTextJson(options: GeminiGenerateOptions): Promise<string> {
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text: options.prompt },
  ];
  if (options.inlineImage) {
    parts.push({
      inline_data: {
        mime_type: options.inlineImage.mimeType,
        data: options.inlineImage.base64,
      },
    });
  }

  const body = { contents: [{ parts }] };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.modelId}:generateContent?key=${options.apiKey}`;

  const response = await fetchGeminiWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    options.stageLabel,
  );

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error(`${options.stageLabel} returned empty content`);
  }
  return text;
}

export function extractJsonObject(text: string, stageLabel: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`${stageLabel} response did not contain JSON object`);
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error(`${stageLabel} returned invalid JSON`);
  }
}
