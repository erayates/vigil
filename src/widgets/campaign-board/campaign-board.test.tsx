import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCampaignStore } from '@/features/campaign/model/use-campaign-store';
import { CampaignBoard } from './campaign-board';

const { exportData, importData } = vi.hoisted(() => ({
  exportData: vi.fn(() => Promise.resolve(null)),
  importData: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/shared/lib/data-bridge', () => ({
  dataBridge: { export: exportData, import: importData },
}));

describe('CampaignBoard campaign selector', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
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

  it('triggers a data export from the backup control', () => {
    render(<CampaignBoard />);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    expect(exportData).toHaveBeenCalled();
  });
});
