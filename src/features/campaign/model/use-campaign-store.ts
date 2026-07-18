import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { campaignBridge, type Campaign, type CampaignSnapshot } from '@/shared/lib/campaign-bridge';
import { isTauriRuntime } from '@/shared/lib/session-bridge';

interface CampaignState {
  campaigns: Campaign[];
  activeId: string;
  applySnapshot: (snapshot: CampaignSnapshot) => void;
  createCampaign: (name: string) => void;
  setActiveCampaign: (id: string) => void;
}

const DEFAULT_CAMPAIGN: Campaign = { id: 'default', name: 'General Campaign', status: 'active' };

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: [DEFAULT_CAMPAIGN],
      activeId: 'default',
      // Under Tauri the Rust core is authoritative; each command returns the full
      // picture, which we mirror here.
      applySnapshot: (snapshot) =>
        set({ campaigns: snapshot.campaigns, activeId: snapshot.activeId }),
      createCampaign: (name) => {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;
        if (isTauriRuntime()) {
          void campaignBridge.create(trimmed).then((snapshot) => {
            if (snapshot) get().applySnapshot(snapshot);
          });
          return;
        }
        const id = crypto.randomUUID();
        set((state) => ({
          campaigns: [...state.campaigns, { id, name: trimmed, status: 'active' }],
          activeId: id,
        }));
      },
      setActiveCampaign: (id) => {
        if (isTauriRuntime()) {
          void campaignBridge.setActive(id).then((snapshot) => {
            if (snapshot) get().applySnapshot(snapshot);
          });
          return;
        }
        set({ activeId: id });
      },
    }),
    {
      name: 'vigil-campaign-state',
      version: 1,
    },
  ),
);

// Hydrate campaigns from the Rust core once, under Tauri. No-op in a plain browser.
let campaignSyncStarted = false;
export async function initCampaignSync(): Promise<void> {
  if (campaignSyncStarted || !isTauriRuntime()) return;
  campaignSyncStarted = true;
  const snapshot = await campaignBridge.get();
  if (snapshot) useCampaignStore.getState().applySnapshot(snapshot);
}
