/** Hook for async virus scanning before marking upload accepted (Gate 2 stub). */
export type VirusScanResult =
  | { status: "clean" }
  | { status: "infected"; detail: string }
  | { status: "skipped"; reason: string };

export interface IVirusScanHook {
  scan(storageKey: string, mimeType: string): Promise<VirusScanResult>;
}

export class NoOpVirusScanHook implements IVirusScanHook {
  async scan(_storageKey: string, _mimeType: string): Promise<VirusScanResult> {
    return { status: "skipped", reason: "scanner_not_configured" };
  }
}
