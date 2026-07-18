import type { SessionRecord } from '@/entities/focus-session/model/types';

export interface FormationIntegrity {
  activeDays: number; // distinct days in the window with a completed watch
  windowDays: number; // 7
  percent: number; // activeDays / effective window, rounded
}

/** Stable local date key (YYYY-MM-DD), shared with stored Recovery Days. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Formation Integrity is a "streak without shame": the share of the last seven
// days that had a completed watch. A missed day lowers it by ~1/7 (a gentle
// degrade, never a reset on one miss). Recovery Days (planned rest with no watch)
// are neutral — they leave the denominator, so intentional rest never lowers it.
// It never touches Disciplina, rank or accumulated work.
export function calculateFormationIntegrity(
  records: SessionRecord[],
  recoveryDays: string[] = [],
  now: Date = new Date(),
): FormationIntegrity {
  const windowDays = 7;
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (windowDays - 1));
  cutoff.setHours(0, 0, 0, 0);

  const activeDayKeys = new Set<string>();
  for (const record of records) {
    if (record.outcome !== 'completed') continue;
    const when = new Date(record.completedAtIso);
    if (when >= cutoff && when <= now) {
      activeDayKeys.add(dayKey(when));
    }
  }

  const recoverySet = new Set(recoveryDays);
  let restDays = 0;
  for (let i = 0; i < windowDays; i += 1) {
    const day = new Date(cutoff);
    day.setDate(cutoff.getDate() + i);
    const key = dayKey(day);
    // Planned rest (marked, not worked) leaves the denominator entirely.
    if (recoverySet.has(key) && !activeDayKeys.has(key)) restDays += 1;
  }

  const activeDays = activeDayKeys.size;
  const effectiveWindow = windowDays - restDays;
  const percent = effectiveWindow > 0 ? Math.round((activeDays / effectiveWindow) * 100) : 100;
  return { activeDays, windowDays, percent };
}
