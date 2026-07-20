import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { isTauriRuntime } from './session-bridge';

const noticeSchema = z.string().nullable();

export const systemBridge = {
  /** A message about something that happened at startup, e.g. a preserved damaged data file. */
  startupNotice: async (): Promise<string | null> => {
    if (!isTauriRuntime()) return null;
    try {
      return noticeSchema.parse(await invoke('startup_notice'));
    } catch (error) {
      console.error('[systemBridge] startup_notice failed', error);
      return null;
    }
  },
};
