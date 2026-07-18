import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { isTauriRuntime } from './session-bridge';

const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
});

const campaignSnapshotSchema = z.object({
  campaigns: z.array(campaignSchema),
  activeId: z.string(),
});

export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignSnapshot = z.infer<typeof campaignSnapshotSchema>;

async function call(
  command: string,
  args?: Record<string, unknown>,
): Promise<CampaignSnapshot | null> {
  if (!isTauriRuntime()) return null;
  try {
    return campaignSnapshotSchema.parse(await invoke(command, args));
  } catch (error) {
    console.error(`[campaignBridge] ${command} failed`, error);
    return null;
  }
}

export const campaignBridge = {
  get: () => call('campaign_get'),
  create: (name: string) => call('campaign_create', { name }),
  setActive: (id: string) => call('campaign_set_active', { id }),
};
