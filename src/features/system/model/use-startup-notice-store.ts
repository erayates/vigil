import { create } from 'zustand';
import { systemBridge } from '@/shared/lib/system-bridge';

interface StartupNoticeState {
  notice: string | null;
  setNotice: (notice: string | null) => void;
  dismiss: () => void;
}

// Deliberately not persisted: a startup notice belongs to this run only.
export const useStartupNoticeStore = create<StartupNoticeState>()((set) => ({
  notice: null,
  setNotice: (notice) => set({ notice }),
  dismiss: () => set({ notice: null }),
}));

export async function initStartupNotice(): Promise<void> {
  const notice = await systemBridge.startupNotice();
  if (notice) useStartupNoticeStore.getState().setNotice(notice);
}
