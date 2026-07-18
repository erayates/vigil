import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { isTauriRuntime } from './session-bridge';

const doctrineSchema = z.object({
  shortBreakMinutes: z.number(),
  longBreakMinutes: z.number(),
});

export type Doctrine = z.infer<typeof doctrineSchema>;

async function call(command: string, args?: Record<string, unknown>): Promise<Doctrine | null> {
  if (!isTauriRuntime()) return null;
  try {
    return doctrineSchema.parse(await invoke(command, args));
  } catch (error) {
    console.error(`[doctrineBridge] ${command} failed`, error);
    return null;
  }
}

export const doctrineBridge = {
  get: () => call('doctrine_get'),
  set: (shortBreakMinutes: number, longBreakMinutes: number) =>
    call('doctrine_set', { shortBreakMinutes, longBreakMinutes }),
};
