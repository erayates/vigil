import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recoveryBridge } from '@/shared/lib/recovery-bridge';
import { isTauriRuntime } from '@/shared/lib/session-bridge';

interface RecoveryState {
  recoveryDays: string[];
  applyDays: (days: string[]) => void;
  toggleDay: (date: string) => void;
}

export const useRecoveryStore = create<RecoveryState>()(
  persist(
    (set, get) => ({
      recoveryDays: [],
      applyDays: (recoveryDays) => set({ recoveryDays }),
      toggleDay: (date) => {
        if (isTauriRuntime()) {
          void recoveryBridge.toggle(date).then((days) => {
            if (days) set({ recoveryDays: days });
          });
          return;
        }
        const current = get().recoveryDays;
        const recoveryDays = current.includes(date)
          ? current.filter((day) => day !== date)
          : [...current, date];
        set({ recoveryDays });
      },
    }),
    {
      name: 'vigil-recovery-state',
      version: 1,
    },
  ),
);

// Hydrate recovery days from the Rust core once, under Tauri. No-op in a browser.
let started = false;
export async function initRecoverySync(): Promise<void> {
  if (started || !isTauriRuntime()) return;
  started = true;
  const days = await recoveryBridge.get();
  if (days) useRecoveryStore.getState().applyDays(days);
}
