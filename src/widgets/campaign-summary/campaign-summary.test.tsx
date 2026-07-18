import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionRecord } from '@/entities/focus-session/model/types';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { CampaignSummary } from './campaign-summary';

function record(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    id: 'x',
    missionTitle: 'Watch',
    victoryCondition: '',
    plannedDurationSeconds: 1500,
    focusedDurationSeconds: 1500,
    completedAtIso: new Date().toISOString(),
    outcome: 'completed',
    ...overrides,
  };
}

describe('CampaignSummary', () => {
  afterEach(() => cleanup());
  beforeEach(() => window.localStorage.clear());

  it('counts only completed watches toward the daily campaign, not abandoned ones', () => {
    useFocusStore.setState({
      history: [
        record({ id: 'a', outcome: 'completed' }),
        record({ id: 'b', outcome: 'abandoned', focusedDurationSeconds: 300 }),
      ],
    });

    render(<CampaignSummary />);

    // 1 completed of 6 => 17%. If the abandoned one counted, it would be 33%.
    expect(screen.getByLabelText('17 percent complete')).toBeInTheDocument();
  });
});
