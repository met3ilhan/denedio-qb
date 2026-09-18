/**
 * Studio-side model of Denedio `persistQuestionImport` skip behavior for existing `importExternalKey`.
 * @see docs/DENEDIO_CONTRACT.md
 */
export function partitionImportItemsByExistingKey<T extends { externalKey?: string }>(
  items: T[],
  existingKeys: Set<string>,
): { toCreate: T[]; skippedExternalKeys: string[] } {
  const skippedExternalKeys: string[] = [];
  const toCreate: T[] = [];

  for (const item of items) {
    const key = item.externalKey?.trim();
    if (key && existingKeys.has(key)) {
      skippedExternalKeys.push(key);
      continue;
    }
    toCreate.push(item);
  }

  return { toCreate, skippedExternalKeys };
}
