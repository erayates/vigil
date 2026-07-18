import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { focusModes } from '@/entities/focus-session/model/modes';
import { calculateRemainingSeconds } from '@/entities/focus-session/lib/time';
import type { FocusModeId, FocusPhase, SessionRecord } from '@/entities/focus-session/model/types';
import { isTauriRuntime, sessionBridge, type SessionSnapshot } from '@/shared/lib/session-bridge';

interface FocusState {
  missionTitle: string;
  victoryCondition: string;
  modeId: FocusModeId;
  customDurationMinutes: number;
  phase: FocusPhase;
  plannedDurationSeconds: number;
  remainingSeconds: number;
  startedAtMs: number | null;
  pauseStartedAtMs: number | null;
  totalPausedMs: number;
  history: SessionRecord[];
  setMissionTitle: (value: string) => void;
  setVictoryCondition: (value: string) => void;
  setModeId: (value: FocusModeId) => void;
  setCustomDurationMinutes: (value: number) => void;
  applySnapshot: (snapshot: SessionSnapshot) => void;
  setHistory: (records: SessionRecord[]) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tick: (nowMs?: number) => void;
  completeSession: () => void;
  abandonSession: () => void;
  resetSession: () => void;
}

function durationFor(modeId: FocusModeId, customDurationMinutes: number): number {
  if (modeId === 'custom') {
    return Math.max(1, customDurationMinutes) * 60;
  }

  return focusModes.find((mode) => mode.id === modeId)?.durationSeconds ?? 25 * 60;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      missionTitle: '',
      victoryCondition: '',
      modeId: 'standard-watch',
      customDurationMinutes: 40,
      phase: 'idle',
      plannedDurationSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      startedAtMs: null,
      pauseStartedAtMs: null,
      totalPausedMs: 0,
      history: [],
      setMissionTitle: (missionTitle) => set({ missionTitle }),
      setVictoryCondition: (victoryCondition) => set({ victoryCondition }),
      setModeId: (modeId) => {
        const plannedDurationSeconds = durationFor(modeId, get().customDurationMinutes);
        set({ modeId, plannedDurationSeconds, remainingSeconds: plannedDurationSeconds });
      },
      setCustomDurationMinutes: (customDurationMinutes) => {
        const plannedDurationSeconds = durationFor('custom', customDurationMinutes);
        set({
          customDurationMinutes,
          plannedDurationSeconds,
          remainingSeconds: plannedDurationSeconds,
        });
      },
      // Authoritative snapshot from the Rust core (Tauri only), mirrored into the store.
      applySnapshot: (snapshot) =>
        set({
          phase: snapshot.phase,
          missionTitle: snapshot.missionTitle,
          victoryCondition: snapshot.victoryCondition,
          plannedDurationSeconds: snapshot.plannedDurationSecs,
          remainingSeconds: snapshot.remainingSecs,
          startedAtMs: snapshot.startedAtMs,
          totalPausedMs: snapshot.totalPausedMs,
          pauseStartedAtMs: snapshot.pauseStartedAtMs,
        }),
      setHistory: (history) => set({ history }),
      startSession: () => {
        const state = get();
        if (state.missionTitle.trim().length === 0 || state.phase !== 'idle') return;
        const plannedDurationSeconds = durationFor(state.modeId, state.customDurationMinutes);
        if (isTauriRuntime()) {
          void sessionBridge.start({
            missionTitle: state.missionTitle,
            victoryCondition: state.victoryCondition,
            plannedDurationSecs: plannedDurationSeconds,
          });
          // Cosmetic preparation delay stays in the UI; Rust owns the transition.
          window.setTimeout(() => {
            if (get().phase === 'preparing') void sessionBridge.begin();
          }, 900);
          return;
        }
        set({
          phase: 'preparing',
          plannedDurationSeconds,
          remainingSeconds: plannedDurationSeconds,
          startedAtMs: null,
          pauseStartedAtMs: null,
          totalPausedMs: 0,
        });
        window.setTimeout(() => {
          if (get().phase === 'preparing') {
            set({ phase: 'focusing', startedAtMs: Date.now() });
          }
        }, 900);
      },
      pauseSession: () => {
        if (get().phase !== 'focusing') return;
        if (isTauriRuntime()) {
          void sessionBridge.pause();
          return;
        }
        get().tick();
        set({ phase: 'paused', pauseStartedAtMs: Date.now() });
      },
      resumeSession: () => {
        const state = get();
        if (state.phase !== 'paused' || state.pauseStartedAtMs === null) return;
        if (isTauriRuntime()) {
          void sessionBridge.resume();
          return;
        }
        const additionalPauseMs = Date.now() - state.pauseStartedAtMs;
        set({
          phase: 'focusing',
          pauseStartedAtMs: null,
          totalPausedMs: state.totalPausedMs + additionalPauseMs,
        });
      },
      tick: (nowMs = Date.now()) => {
        const state = get();
        if (state.phase !== 'focusing' || state.startedAtMs === null) return;
        const remainingSeconds = calculateRemainingSeconds({
          plannedDurationSeconds: state.plannedDurationSeconds,
          startedAtMs: state.startedAtMs,
          nowMs,
          totalPausedMs: state.totalPausedMs,
        });
        if (remainingSeconds === 0) {
          set({ remainingSeconds: 0 });
          get().completeSession();
          return;
        }
        set({ remainingSeconds });
      },
      completeSession: () => {
        const state = get();
        if (!['focusing', 'paused'].includes(state.phase)) return;
        if (isTauriRuntime()) {
          void sessionBridge.complete();
          return;
        }
        const focusedDurationSeconds = Math.max(
          0,
          state.plannedDurationSeconds - state.remainingSeconds,
        );
        const record: SessionRecord = {
          id: crypto.randomUUID(),
          missionTitle: state.missionTitle,
          victoryCondition: state.victoryCondition,
          plannedDurationSeconds: state.plannedDurationSeconds,
          focusedDurationSeconds,
          completedAtIso: new Date().toISOString(),
          outcome: 'completed',
        };
        set({
          phase: 'complete',
          pauseStartedAtMs: null,
          history: [record, ...state.history].slice(0, 20),
        });
      },
      // ABANDON transition. The reason-capture flow + UI is VIGIL-008.
      abandonSession: () => {
        const state = get();
        if (!['focusing', 'paused'].includes(state.phase)) return;
        if (isTauriRuntime()) {
          void sessionBridge.abandon();
          return;
        }
        set({ phase: 'abandoned', pauseStartedAtMs: null });
      },
      resetSession: () => {
        const state = get();
        const plannedDurationSeconds = durationFor(state.modeId, state.customDurationMinutes);
        if (isTauriRuntime()) {
          void sessionBridge.reset();
          return;
        }
        set({
          phase: 'idle',
          remainingSeconds: plannedDurationSeconds,
          plannedDurationSeconds,
          startedAtMs: null,
          pauseStartedAtMs: null,
          totalPausedMs: 0,
        });
      },
    }),
    {
      name: 'vigil-focus-state',
      version: 2,
    },
  ),
);

async function refreshHistory(): Promise<void> {
  const records = await sessionBridge.history();
  useFocusStore.getState().setHistory(
    records.map((record) => ({
      id: record.id,
      missionTitle: record.missionTitle,
      victoryCondition: record.victoryCondition,
      plannedDurationSeconds: record.plannedDurationSeconds,
      focusedDurationSeconds: record.focusedDurationSeconds,
      completedAtIso: new Date(record.completedAtMs).toISOString(),
      outcome: record.outcome === 'abandoned' ? 'abandoned' : 'completed',
    })),
  );
}

// Under Tauri the Rust core is authoritative: hydrate state + history from it, then
// mirror every session://changed broadcast. In a plain browser this is a no-op and
// the store keeps its local behaviour. Idempotent — safe to call once per window.
let sessionSyncStarted = false;
export async function initSessionSync(): Promise<void> {
  if (sessionSyncStarted || !isTauriRuntime()) return;
  sessionSyncStarted = true;
  const snapshot = await sessionBridge.get();
  if (snapshot) useFocusStore.getState().applySnapshot(snapshot);
  await refreshHistory();
  await sessionBridge.subscribe((next) => {
    useFocusStore.getState().applySnapshot(next);
    void refreshHistory();
  });
}
