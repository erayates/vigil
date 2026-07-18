import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { isTauriRuntime } from './session-bridge';

const daysSchema = z.array(z.string());

async function call(command: string, args?: Record<string, unknown>): Promise<string[] | null> {
  if (!isTauriRuntime()) return null;
  try {
    return daysSchema.parse(await invoke(command, args));
  } catch (error) {
    console.error(`[recoveryBridge] ${command} failed`, error);
    return null;
  }
}

export const recoveryBridge = {
  get: () => call('recovery_days_get'),
  toggle: (date: string) => call('recovery_day_toggle', { date }),
};
