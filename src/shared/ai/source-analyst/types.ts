import type { SourceAnalystEnvelope } from "@/shared/validation/source-extraction";

export type SourceAnalystInput = {
  sourceFileId: string;
  storageKey: string;
  mimeType: string;
  originalFilename: string;
  languageHint?: string | null;
  subjectHint?: string | null;
  bytes: Buffer;
};

export interface ISourceAnalystProvider {
  readonly providerId: string;
  readonly modelId: string;
  extract(input: SourceAnalystInput): Promise<SourceAnalystEnvelope>;
}
