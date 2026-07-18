import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { z } from 'zod';

const sessionSnapshotSchema = z.object({
  phase: z.enum(['idle', 'preparing', 'focusing', 'paused', 'complete', 'abandoned', 'debrief']),
  missionTitle: z.string(),
  victoryCondition: z.string(),
  plannedDurationSecs: z.number(),
  startedAtMs: z.number().nullable(),
  totalPausedMs: z.number(),
  pauseStartedAtMs: z.number().nullable(),
  remainingSecs: z.number(),
});

export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;

const historyRecordSchema = z.object({
  id: z.string(),
  missionTitle: z.string(),
  victoryCondition: z.string(),
  plannedDurationSeconds: z.number(),
  focusedDurationSeconds: z.number(),
  completedAtMs: z.number(),
  outcome: z.string(),
});

export type HistoryRecordDto = z.infer<typeof historyRecordSchema>;

export interface StartSessionArgs {
  missionTitle: string;
  victoryCondition: string;
  plannedDurationSecs: number;
}

export interface DebriefFields {
  result: string;
  blocker: string;
  nextAction: string;
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function call(
  command: string,
  args?: Record<string, unknown>,
): Promise<SessionSnapshot | null> {
  if (!isTauriRuntime()) return null;
  try {
    return sessionSnapshotSchema.parse(await invoke(command, args));
  } catch (error) {
    console.error(`[sessionBridge] ${command} failed`, error);
    return null;
  }
}

export const sessionBridge = {
  get: () => call('session_get'),
  start: (args: StartSessionArgs) => call('session_start', { ...args }),
  begin: () => call('session_begin'),
  cancel: () => call('session_cancel'),
  abandon: () => call('session_abandon'),
  pause: () => call('session_pause'),
  resume: () => call('session_resume'),
  complete: () => call('session_complete'),
  openDebrief: () => call('session_open_debrief'),
  record: (fields: DebriefFields) => call('session_record', { ...fields }),
  reset: () => call('session_reset'),
  history: async (): Promise<HistoryRecordDto[]> => {
    if (!isTauriRuntime()) return [];
    try {
      return z.array(historyRecordSchema).parse(await invoke('session_history'));
    } catch (error) {
      console.error('[sessionBridge] session_history failed', error);
      return [];
    }
  },
  subscribe: async (onChange: (snapshot: SessionSnapshot) => void): Promise<UnlistenFn> => {
    if (!isTauriRuntime()) return () => {};
    return listen('session://changed', (event) => {
      const parsed = sessionSnapshotSchema.safeParse(event.payload);
      if (parsed.success) onChange(parsed.data);
      else console.error('[sessionBridge] invalid session://changed payload', parsed.error);
    });
  },
};
