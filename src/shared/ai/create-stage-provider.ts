import {
  hasGeminiApiKey,
  hasOpenRouterApiKey,
  resolveLiveProvider,
  resolveProviderMode,
  type ProviderMode,
} from "./provider-mode";

export type StageProviderFactories<T> = {
  openrouter: () => T;
  gemini: () => T;
  mock: () => T;
  unconfiguredLive: () => T;
  demo?: () => T;
  manual?: () => T;
};

export function resolveLiveVendorProvider<T>(
  factories: Pick<StageProviderFactories<T>, "openrouter" | "gemini" | "unconfiguredLive">,
): T {
  const vendor = resolveLiveProvider();
  if (vendor === "openrouter") {
    return hasOpenRouterApiKey() ? factories.openrouter() : factories.unconfiguredLive();
  }
  return hasGeminiApiKey() ? factories.gemini() : factories.unconfiguredLive();
}

const caches = new Map<string, { mode: ProviderMode; instance: unknown }>();
const testOverrides = new Map<string, unknown>();

export function setStageProviderForTests<T>(namespace: string, next: T | undefined): void {
  if (next === undefined) {
    testOverrides.delete(namespace);
  } else {
    testOverrides.set(namespace, next);
  }
  caches.delete(namespace);
}

export function resetStageProviderCache(namespace?: string): void {
  if (namespace) {
    caches.delete(namespace);
    return;
  }
  caches.clear();
}

export function createStageProvider<T>(namespace: string, factories: StageProviderFactories<T>): T {
  const testOverride = testOverrides.get(namespace);
  if (testOverride) {
    return testOverride as T;
  }

  const cached = caches.get(namespace);
  const mode = resolveProviderMode();
  if (cached && cached.mode === mode) {
    return cached.instance as T;
  }

  let instance: T;
  if (mode === "LIVE") {
    instance = resolveLiveVendorProvider(factories);
  } else if (mode === "DEMO" && factories.demo) {
    instance = factories.demo();
  } else if (mode === "MANUAL" && factories.manual) {
    instance = factories.manual();
  } else {
    instance = factories.mock();
  }

  caches.set(namespace, { mode, instance });
  return instance;
}
