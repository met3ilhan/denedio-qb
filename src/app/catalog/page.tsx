import { StudioShell } from "@/components/studio/StudioShell";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { loadCatalogMirror } from "@/modules/catalog";
import { tr } from "@/shared/copy/tr";

export default function CatalogPage() {
  const mirror = loadCatalogMirror();

  return (
    <StudioShell activePhase="SHIP" showBlockers={false}>
      <div>
        <p className="font-mono text-xs text-[var(--qs-text-muted)]">{tr.catalog.screen}</p>
        <h1 className="text-xl font-semibold text-[var(--qs-text)]">{tr.catalog.title}</h1>
        <p className="mt-2 text-sm text-[var(--qs-text-muted)]">{tr.catalog.hint}</p>
        <div className="mt-6">
          <CatalogBrowser mirror={mirror} selectedTopicId={mirror.defaults.topicId} />
        </div>
      </div>
    </StudioShell>
  );
}
