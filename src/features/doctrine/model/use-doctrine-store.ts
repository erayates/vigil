import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doctrineBridge, type Doctrine } from '@/shared/lib/doctrine-bridge';
import { isTauriRuntime } from '@/shared/lib/session-bridge';

interface DoctrineState {
  shortBreakMinutes: number;
  longBreakMinutes: number;
  applyDoctrine: (doctrine: Doctrine) => void;
  setDoctrine: (shortBreakMinutes: number, longBreakMinutes: number) => void;
}

const clampMinutes = (minutes: number) => Math.min(120, Math.max(1, Math.round(minutes) || 1));

export const useDoctrineStore = create<DoctrineState>()(
  persist(
    (set) => ({
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      applyDoctrine: (doctrine) =>
        set({
          shortBreakMinutes: doctrine.shortBreakMinutes,
          longBreakMinutes: doctrine.longBreakMinutes,
        }),
      setDoctrine: (shortBreakMinutes, longBreakMinutes) => {
        const short = clampMinutes(shortBreakMinutes);
        const long = clampMinutes(longBreakMinutes);
        if (isTauriRuntime()) {
          void doctrineBridge.set(short, long).then((doctrine) => {
            if (doctrine) {
              set({
                shortBreakMinutes: doctrine.shortBreakMinutes,
                longBreakMinutes: doctrine.longBreakMinutes,
              });
            }
          });
          return;
        }
        set({ shortBreakMinutes: short, longBreakMinutes: long });
      },
    }),
    {
      name: 'vigil-doctrine-state',
      version: 1,
    },
  ),
);

// Hydrate Doctrine from the Rust core once, under Tauri. No-op in a plain browser.
let doctrineSyncStarted = false;
export async function initDoctrineSync(): Promise<void> {
  if (doctrineSyncStarted || !isTauriRuntime()) return;
  doctrineSyncStarted = true;
  const doctrine = await doctrineBridge.get();
  if (doctrine) useDoctrineStore.getState().applyDoctrine(doctrine);
}
