import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '@/entities/focus-session/model/types';
import { calculateFormationIntegrity, dayKey } from './formation';

const NOW = new Date('2026-07-18T12:00:00Z');
function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 3600 * 1000).toISOString();
}
function record(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    id: 'x',
    missionTitle: 'Watch',
    victoryCondition: '',
    plannedDurationSeconds: 1500,
    focusedDurationSeconds: 1500,
    completedAtIso: daysAgo(0),
    outcome: 'completed',
    ...overrides,
  };
}

describe('calculateFormationIntegrity', () => {
  it('counts distinct active days within the last seven', () => {
    const integrity = calculateFormationIntegrity(
      [
        record({ id: 'a', completedAtIso: daysAgo(0) }),
        record({ id: 'b', completedAtIso: daysAgo(0) }), // same day → still one active day
        record({ id: 'c', completedAtIso: daysAgo(2) }),
        record({ id: 'd', completedAtIso: daysAgo(3) }),
        record({ id: 'e', completedAtIso: daysAgo(30) }), // outside the window
        record({ id: 'f', outcome: 'abandoned', completedAtIso: daysAgo(1) }), // not completed
      ],
      [],
      NOW,
    );
    expect(integrity.activeDays).toBe(3);
    expect(integrity.windowDays).toBe(7);
    expect(integrity.percent).toBe(43); // round(3/7*100)
  });

  it('is zero with no recent completed watches', () => {
    const integrity = calculateFormationIntegrity(
      [record({ completedAtIso: daysAgo(30) })],
      [],
      NOW,
    );
    expect(integrity.activeDays).toBe(0);
    expect(integrity.percent).toBe(0);
  });

  it('treats a marked recovery day as neutral, raising integrity', () => {
    const records = [record({ id: 'a', completedAtIso: daysAgo(0) })]; // 1 active day
    const restKey = dayKey(new Date(daysAgo(1)));

    const without = calculateFormationIntegrity(records, [], NOW);
    const withRecovery = calculateFormationIntegrity(records, [restKey], NOW);

    expect(without.percent).toBe(14); // round(1/7*100)
    expect(withRecovery.percent).toBe(17); // round(1/6*100) — rest day left the denominator
  });
});
