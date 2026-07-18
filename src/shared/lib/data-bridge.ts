import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { isTauriRuntime } from './session-bridge';

const importSummarySchema = z.object({
  campaignsAdded: z.number(),
  missionsAdded: z.number(),
  sessionsAdded: z.number(),
  settingsAdded: z.number(),
});

export type ImportSummary = z.infer<typeof importSummarySchema>;

// Export/import operate on the authoritative SQLite data, so they are Tauri-only;
// in a plain browser these resolve to null and the UI simply does nothing.
export const dataBridge = {
  export: async (): Promise<string | null> => {
    if (!isTauriRuntime()) return null;
    try {
      return z.string().parse(await invoke('data_export'));
    } catch (error) {
      console.error('[dataBridge] data_export failed', error);
      return null;
    }
  },
  import: async (json: string): Promise<ImportSummary | null> => {
    if (!isTauriRuntime()) return null;
    try {
      return importSummarySchema.parse(await invoke('data_import', { json }));
    } catch (error) {
      console.error('[dataBridge] data_import failed', error);
      return null;
    }
  },
};
