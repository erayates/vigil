import type { SessionRecord } from '@/entities/focus-session/model/types';

export interface Disciplina {
  completedWatches: number;
  focusedMinutes: number;
  points: number;
}

// Disciplina is a NON-PUNITIVE consistency measure: it is derived only from
// completed watches (accepted records), and it can only grow — a missed day never
// reduces it (there is no date-based decay here by design). Abandoned sessions
// keep their recorded focus time elsewhere but do not earn Disciplina, which
// tracks completions. Policy: docs/domain/disciplina-policy.md.
export function calculateDisciplina(records: SessionRecord[]): Disciplina {
  const completed = records.filter((record) => record.outcome === 'completed');
  const completedWatches = completed.length;
  const focusedMinutes = Math.floor(
    completed.reduce((sum, record) => sum + record.focusedDurationSeconds, 0) / 60,
  );
  const points = completedWatches * 10 + focusedMinutes;
  return { completedWatches, focusedMinutes, points };
}
