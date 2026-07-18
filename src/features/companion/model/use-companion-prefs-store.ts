import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { companionPrefsBridge, type CompanionPrefs } from '@/shared/lib/companion-prefs-bridge';
import { isTauriRuntime } from '@/shared/lib/session-bridge';

type Side = 'left' | 'right';

interface CompanionPrefsState {
  side: Side;
  scale: number;
  opacity: number;
  applyPrefs: (prefs: CompanionPrefs) => void;
  setPrefs: (side: Side, scale: number, opacity: number) => void;
}

const clampScale = (value: number) => Math.min(2, Math.max(0.5, value || 1));
const clampOpacity = (value: number) => Math.min(1, Math.max(0.3, value || 1));

export const useCompanionPrefsStore = create<CompanionPrefsState>()(
  persist(
    (set) => ({
      side: 'right',
      scale: 1,
      opacity: 1,
      applyPrefs: (prefs) => set({ side: prefs.side, scale: prefs.scale, opacity: prefs.opacity }),
      setPrefs: (side, scale, opacity) => {
        const nextScale = clampScale(scale);
        const nextOpacity = clampOpacity(opacity);
        // Optimistic update keeps sliders smooth; the Rust broadcast confirms and
        // drives the companion window live.
        set({ side, scale: nextScale, opacity: nextOpacity });
        if (isTauriRuntime()) {
          void companionPrefsBridge.set(side, nextScale, nextOpacity);
        }
      },
    }),
    {
      name: 'vigil-companion-prefs',
      version: 1,
    },
  ),
);

// Hydrate from the Rust core and mirror every companion://prefs broadcast so the
// companion window applies scale/opacity live. No-op in a plain browser.
let started = false;
export async function initCompanionPrefsSync(): Promise<void> {
  if (started || !isTauriRuntime()) return;
  started = true;
  const prefs = await companionPrefsBridge.get();
  if (prefs) useCompanionPrefsStore.getState().applyPrefs(prefs);
  await companionPrefsBridge.subscribe((next) =>
    useCompanionPrefsStore.getState().applyPrefs(next),
  );
}
