import { isDemoMode } from "@/shared/ai/demo";

export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6"
      data-testid="demo-mode-banner"
      role="status"
    >
      <span className="font-semibold">ÖRNEK / DEMO</span>
      <span className="ml-2 text-amber-900">
        Deterministic mock fixtures — not live AI output. Disable{" "}
        <code className="font-mono text-xs">QUESTION_STUDIO_DEMO_MODE</code> for provider generation.
      </span>
    </div>
  );
}
