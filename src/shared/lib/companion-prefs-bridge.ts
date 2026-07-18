import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { z } from 'zod';
import { isTauriRuntime } from './session-bridge';

const companionPrefsSchema = z.object({
  side: z.enum(['left', 'right']),
  scale: z.number(),
  opacity: z.number(),
});

export type CompanionPrefs = z.infer<typeof companionPrefsSchema>;

async function call(
  command: string,
  args?: Record<string, unknown>,
): Promise<CompanionPrefs | null> {
  if (!isTauriRuntime()) return null;
  try {
    return companionPrefsSchema.parse(await invoke(command, args));
  } catch (error) {
    console.error(`[companionPrefsBridge] ${command} failed`, error);
    return null;
  }
}

export const companionPrefsBridge = {
  get: () => call('companion_prefs_get'),
  set: (side: 'left' | 'right', scale: number, opacity: number) =>
    call('companion_prefs_set', { side, scale, opacity }),
  subscribe: async (onChange: (prefs: CompanionPrefs) => void): Promise<UnlistenFn> => {
    if (!isTauriRuntime()) return () => {};
    return listen('companion://prefs', (event) => {
      const parsed = companionPrefsSchema.safeParse(event.payload);
      if (parsed.success) onChange(parsed.data);
    });
  },
};
