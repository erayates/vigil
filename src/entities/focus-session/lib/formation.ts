import type { SessionRecord } from '@/entities/focus-session/model/types';

export interface FormationIntegrity {
  activeDays: number; // distinct days in the window with a completed watch
  windowDays: number; // 7
  percent: number; // activeDays / windowDays, rounded
}

// Formation Integrity is a "streak without shame": the share of the last seven
// days that had at least one completed watch. A missed day lowers it by roughly
// one seventh — a gentle degrade, never a reset to zero on a single miss — and it
// recovers as active days accumulate. It never touches Disciplina, rank or any
// accumulated work; it is only a recent-consistency indicator.
export function calculateFormationIntegrity(
  records: SessionRecord[],
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
      activeDayKeys.add(when.toDateString());
    }
  }

  const activeDays = activeDayKeys.size;
  return { activeDays, windowDays, percent: Math.round((activeDays / windowDays) * 100) };
}
