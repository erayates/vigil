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
// The formula, given the two authoritative lifetime totals. Kept separate so the
// dashboard can feed it the full-database aggregate instead of the capped history.
export function disciplinaFromTotals(
  completedWatches: number,
  completedFocusedSeconds: number,
): Disciplina {
  const focusedMinutes = Math.floor(completedFocusedSeconds / 60);
  return { completedWatches, focusedMinutes, points: completedWatches * 10 + focusedMinutes };
}

export function calculateDisciplina(records: SessionRecord[]): Disciplina {
  const completed = records.filter((record) => record.outcome === 'completed');
  const completedFocusedSeconds = completed.reduce(
    (sum, record) => sum + record.focusedDurationSeconds,
    0,
  );
  return disciplinaFromTotals(completed.length, completedFocusedSeconds);
}

/**
 * Disciplina from the authoritative lifetime totals when present (Tauri), else
 * from the local records (browser). Both windows call this, so they can never
 * show a different rank for the same user.
 */
export function resolveDisciplina(
  lifetime: { completedWatches: number; completedFocusedSeconds: number } | null,
  records: SessionRecord[],
): Disciplina {
  return lifetime
    ? disciplinaFromTotals(lifetime.completedWatches, lifetime.completedFocusedSeconds)
    : calculateDisciplina(records);
}
