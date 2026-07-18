import { beforeEach, describe, expect, it } from 'vitest';
import { useCampaignStore } from './use-campaign-store';

describe('useCampaignStore (browser mode)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useCampaignStore.setState({
      campaigns: [{ id: 'default', name: 'General Campaign', status: 'active' }],
      activeId: 'default',
    });
  });

  it('creates a campaign and makes it active', () => {
    useCampaignStore.getState().createCampaign('Launch');

    const { campaigns, activeId } = useCampaignStore.getState();
    expect(campaigns).toHaveLength(2);
    const added = campaigns.find((campaign) => campaign.name === 'Launch');
    expect(added).toBeDefined();
    expect(activeId).toBe(added?.id);
  });

  it('ignores a blank campaign name', () => {
    useCampaignStore.getState().createCampaign('   ');
    expect(useCampaignStore.getState().campaigns).toHaveLength(1);
  });

  it('switches the active campaign', () => {
    useCampaignStore.getState().createCampaign('Launch');
    useCampaignStore.getState().setActiveCampaign('default');
    expect(useCampaignStore.getState().activeId).toBe('default');
  });
});
