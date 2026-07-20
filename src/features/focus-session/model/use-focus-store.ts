import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { focusModes } from '@/entities/focus-session/model/modes';
import { detectSuspendGap } from '@/entities/focus-session/lib/suspend';
import { calculateRemainingSeconds } from '@/entities/focus-session/lib/time';
import type { FocusModeId, FocusPhase, SessionRecord } from '@/entities/focus-session/model/types';
import {
  isTauriRuntime,
  sessionBridge,
  type DebriefFields,
  type SessionSnapshot,
} from '@/shared/lib/session-bridge';

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
  /** Wall clock of the last tick, used to notice the machine slept. */
  lastTickMs: number | null;
  /** An away interval the user has not classified yet. */
  pendingGapMs: number | null;
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
  openDebrief: () => void;
  recordDebrief: (fields: DebriefFields) => void;
  startBreak: (plannedDurationSecs: number) => void;
  endBreak: () => void;
  keepGapAsFocus: () => void;
  excludeGap: () => void;
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
      lastTickMs: null,
      pendingGapMs: null,
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
      applySnapshot: (snapshot) => {
        // Any phase change (including pause/resume driven from the other window)
        // restarts the gap clock, so a pause is never mistaken for machine sleep.
        const phaseChanged = get().phase !== snapshot.phase;
        set({
          phase: snapshot.phase,
          missionTitle: snapshot.missionTitle,
          victoryCondition: snapshot.victoryCondition,
          plannedDurationSeconds: snapshot.plannedDurationSecs,
          remainingSeconds: snapshot.remainingSecs,
          startedAtMs: snapshot.startedAtMs,
          totalPausedMs: snapshot.totalPausedMs,
          pauseStartedAtMs: snapshot.pauseStartedAtMs,
          ...(phaseChanged ? { lastTickMs: null } : {}),
          ...(snapshot.phase === 'preparing' ? { pendingGapMs: null } : {}),
        });
      },
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
          lastTickMs: null,
          pendingGapMs: null,
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
        set({ phase: 'paused', pauseStartedAtMs: Date.now(), lastTickMs: null });
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
          lastTickMs: null,
        });
      },
      // Drives both the focus countdown and the break countdown from the
      // authoritative startedAt; each ends itself when it reaches zero.
      tick: (nowMs = Date.now()) => {
        const state = get();
        if (state.startedAtMs === null) return;
        if (state.phase !== 'focusing' && state.phase !== 'break') return;

        // A tick gap far larger than the interval means the clock ran on without
        // us — the machine slept. Only recorded as an offer; never applied here.
        const gap = state.phase === 'focusing' ? detectSuspendGap(state.lastTickMs, nowMs) : null;
        const gapPatch = gap === null ? {} : { pendingGapMs: (state.pendingGapMs ?? 0) + gap };

        const remainingSeconds = calculateRemainingSeconds({
          plannedDurationSeconds: state.plannedDurationSeconds,
          startedAtMs: state.startedAtMs,
          nowMs,
          totalPausedMs: state.totalPausedMs,
        });
        if (remainingSeconds === 0) {
          set({ remainingSeconds: 0, lastTickMs: nowMs, ...gapPatch });
          if (state.phase === 'focusing') get().completeSession();
          else get().endBreak();
          return;
        }
        set({ remainingSeconds, lastTickMs: nowMs, ...gapPatch });
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
      // OPEN_DEBRIEF — the finished watch enters the optional debrief step.
      openDebrief: () => {
        const state = get();
        if (!['complete', 'abandoned'].includes(state.phase)) return;
        if (isTauriRuntime()) {
          void sessionBridge.openDebrief();
          return;
        }
        set({ phase: 'debrief' });
      },
      // RECORD — attach the debrief to the just-finished record, then return to idle.
      recordDebrief: (fields) => {
        const state = get();
        if (state.phase !== 'debrief') return;
        if (isTauriRuntime()) {
          void sessionBridge.record(fields);
          return;
        }
        // Only attach non-blank answers, so a skipped field stays absent (mirrors
        // the Rust side storing blanks as NULL).
        const debrief: Partial<Pick<SessionRecord, 'result' | 'blocker' | 'nextAction'>> = {};
        if (fields.result.trim()) debrief.result = fields.result.trim();
        if (fields.blocker.trim()) debrief.blocker = fields.blocker.trim();
        if (fields.nextAction.trim()) debrief.nextAction = fields.nextAction.trim();
        const [latest, ...rest] = state.history;
        const history = latest ? [{ ...latest, ...debrief }, ...rest] : state.history;
        const plannedDurationSeconds = durationFor(state.modeId, state.customDurationMinutes);
        set({
          phase: 'idle',
          history,
          remainingSeconds: plannedDurationSeconds,
          plannedDurationSeconds,
          startedAtMs: null,
          pauseStartedAtMs: null,
          totalPausedMs: 0,
        });
      },
      // START_BREAK — optional recovery between watches (idle or just finished).
      startBreak: (plannedDurationSecs) => {
        const { phase } = get();
        if (phase !== 'idle' && phase !== 'complete') return;
        if (isTauriRuntime()) {
          void sessionBridge.startBreak(plannedDurationSecs);
          return;
        }
        set({
          phase: 'break',
          plannedDurationSeconds: plannedDurationSecs,
          remainingSeconds: plannedDurationSecs,
          startedAtMs: Date.now(),
          pauseStartedAtMs: null,
          totalPausedMs: 0,
          lastTickMs: null,
          missionTitle: '',
          victoryCondition: '',
        });
      },
      // The user's answer to a detected away interval. Keeping it is the default:
      // ignoring the offer leaves the time counted as focus, exactly as before.
      keepGapAsFocus: () => set({ pendingGapMs: null }),
      excludeGap: () => {
        const gap = get().pendingGapMs;
        if (gap === null || gap <= 0) return;
        if (isTauriRuntime()) {
          void sessionBridge.discountGap(gap);
          set({ pendingGapMs: null });
          return;
        }
        set({ totalPausedMs: get().totalPausedMs + gap, pendingGapMs: null });
      },
      endBreak: () => {
        const state = get();
        if (state.phase !== 'break') return;
        if (isTauriRuntime()) {
          void sessionBridge.endBreak();
          return;
        }
        const plannedDurationSeconds = durationFor(state.modeId, state.customDurationMinutes);
        set({
          phase: 'idle',
          plannedDurationSeconds,
          remainingSeconds: plannedDurationSeconds,
          startedAtMs: null,
          pauseStartedAtMs: null,
          totalPausedMs: 0,
        });
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
    // History only changes when a session ends; skip the DB read otherwise.
    if (next.phase === 'complete' || next.phase === 'abandoned') void refreshHistory();
  });
}
