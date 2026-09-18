import { resolveProviderMode } from "@/shared/ai/demo";
import { tr } from "@/shared/copy/tr";

export function ProviderModeBanner() {
  const mode = resolveProviderMode();
  if (mode === "LIVE") {
    return null;
  }

  const copy = tr.providerMode[mode];

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6"
      data-testid="provider-mode-banner"
      data-provider-mode={mode}
      role="status"
    >
      <span className="font-semibold">{copy.badge}</span>
      <span className="ml-2 text-amber-900">{copy.body}</span>
    </div>
  );
}

/** @deprecated Use ProviderModeBanner */
export function DemoModeBanner() {
  return <ProviderModeBanner />;
}
