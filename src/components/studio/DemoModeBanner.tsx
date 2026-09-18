import { isDemoMode } from "@/shared/ai/demo";
import { tr } from "@/shared/copy/tr";

export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6"
      data-testid="demo-mode-banner"
      role="status"
    >
      <span className="font-semibold">{tr.demo.badge}</span>
      <span className="ml-2 text-amber-900">{tr.demo.body}</span>
    </div>
  );
}
