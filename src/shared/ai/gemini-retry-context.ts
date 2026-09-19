import { AsyncLocalStorage } from "async_hooks";

import type { GeminiRetryEvent } from "./gemini-retry";

type Store = {
  onRetry?: (event: GeminiRetryEvent) => void;
};

const storage = new AsyncLocalStorage<Store>();

export function getGeminiRetryListener(): ((event: GeminiRetryEvent) => void) | undefined {
  return storage.getStore()?.onRetry;
}

export function runWithGeminiRetryListener<T>(
  onRetry: ((event: GeminiRetryEvent) => void) | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run({ onRetry }, fn);
}
