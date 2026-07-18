import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCampaignStore } from '@/features/campaign/model/use-campaign-store';
import { CampaignBoard } from './campaign-board';

describe('CampaignBoard campaign selector', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    window.localStorage.clear();
    useCampaignStore.setState({
      campaigns: [{ id: 'default', name: 'General Campaign', status: 'active' }],
      activeId: 'default',
    });
  });

  it('creates a campaign from the selector and lists it as an option', () => {
    render(<CampaignBoard />);

    fireEvent.click(screen.getByRole('button', { name: /new campaign/i }));
    fireEvent.change(screen.getByLabelText('New campaign name'), { target: { value: 'Launch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(useCampaignStore.getState().campaigns).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Launch' })).toBeInTheDocument();
  });
});
