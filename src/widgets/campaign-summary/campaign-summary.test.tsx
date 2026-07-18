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

  it('sums focus time and completed watches across the last seven days', () => {
    const now = Date.now();
    const daysAgo = (n: number) => new Date(now - n * 24 * 3600 * 1000).toISOString();
    useFocusStore.setState({
      history: [
        record({ id: 'a', focusedDurationSeconds: 1500, completedAtIso: daysAgo(0) }),
        record({ id: 'b', focusedDurationSeconds: 600, completedAtIso: daysAgo(3) }),
        record({
          id: 'c',
          outcome: 'abandoned',
          focusedDurationSeconds: 300,
          completedAtIso: daysAgo(5),
        }),
        // 30 days ago: outside the week, must be excluded.
        record({ id: 'd', focusedDurationSeconds: 900, completedAtIso: daysAgo(30) }),
      ],
    });

    render(<CampaignSummary />);

    // 1500 + 600 + 300 = 2400s = 40m of focus in the week; 2 completed (a, b).
    expect(screen.getByLabelText('This week')).toHaveTextContent(/40m.*2 watches/);
  });
});
