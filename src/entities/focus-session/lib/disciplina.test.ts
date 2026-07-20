import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '@/entities/focus-session/model/types';
import { calculateDisciplina, disciplinaFromTotals } from './disciplina';

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

describe('calculateDisciplina', () => {
  it('earns points only from completed watches', () => {
    const d = calculateDisciplina([
      record({ id: 'a', outcome: 'completed', focusedDurationSeconds: 1500 }), // 25 min
      record({ id: 'b', outcome: 'abandoned', focusedDurationSeconds: 1500 }), // ignored
    ]);
    expect(d.completedWatches).toBe(1);
    expect(d.focusedMinutes).toBe(25);
    expect(d.points).toBe(35); // 1*10 + 25
  });

  it('is zero with no completed watches', () => {
    const d = calculateDisciplina([record({ outcome: 'abandoned' })]);
    expect(d).toEqual({ completedWatches: 0, focusedMinutes: 0, points: 0 });
  });

  it('matches the totals path (the same formula, fed authoritative counts)', () => {
    // 60 completed watches of 25 min — more than the capped history could hold,
    // which is exactly why the dashboard feeds the aggregate through this door.
    const d = disciplinaFromTotals(60, 60 * 1500);
    expect(d.completedWatches).toBe(60);
    expect(d.focusedMinutes).toBe(1500);
    expect(d.points).toBe(2100); // 60*10 + 1500
  });
});
