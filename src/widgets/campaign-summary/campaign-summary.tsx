import { useMemo } from 'react';
import { calculateDisciplina } from '@/entities/focus-session/lib/disciplina';
import { calculateFormationIntegrity } from '@/entities/focus-session/lib/formation';
import { calculateRank } from '@/entities/focus-session/lib/rank';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';

function compactDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

// Fixed labels keep the weekly chart locale-independent and deterministic for
// visual regression baselines.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CampaignSummary() {
  const history = useFocusStore((state) => state.history);
  const { todaySessions, todaySeconds, totalSeconds } = useMemo(() => {
    const today = new Date().toDateString();
    const todayRecords = history.filter(
      (record) => new Date(record.completedAtIso).toDateString() === today,
    );
    return {
      // Only completed watches count toward the daily campaign; abandoned ones
      // still contributed focus time but are not victories.
      todaySessions: todayRecords.filter((record) => record.outcome === 'completed').length,
      todaySeconds: todayRecords.reduce((sum, record) => sum + record.focusedDurationSeconds, 0),
      totalSeconds: history.reduce((sum, record) => sum + record.focusedDurationSeconds, 0),
    };
  }, [history]);

  // Last seven days (today last), derived entirely from the persisted records.
  const { weekDays, weekSeconds, weekCompleted } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const key = day.toDateString();
      const dayRecords = history.filter(
        (record) => new Date(record.completedAtIso).toDateString() === key,
      );
      return {
        key,
        label: WEEKDAYS[day.getDay()],
        seconds: dayRecords.reduce((sum, record) => sum + record.focusedDurationSeconds, 0),
        completed: dayRecords.filter((record) => record.outcome === 'completed').length,
      };
    });
    return {
      weekDays: days,
      weekSeconds: days.reduce((sum, day) => sum + day.seconds, 0),
      weekCompleted: days.reduce((sum, day) => sum + day.completed, 0),
    };
  }, [history]);
  const maxDaySeconds = Math.max(1, ...weekDays.map((day) => day.seconds));
  const disciplina = useMemo(() => calculateDisciplina(history), [history]);
  const rank = useMemo(() => calculateRank(disciplina.points), [disciplina.points]);
  const formation = useMemo(() => calculateFormationIntegrity(history), [history]);

  const target = 6;
  const progress = Math.min(100, (todaySessions / target) * 100);

  return (
    <section className="campaign-summary" aria-label="Campaign progress and focus statistics">
      <article className="campaign-progress-card pixel-frame pixel-frame--dark">
        <header>
          <span aria-hidden="true">⚑</span>
          <h2>Campaign Progress</h2>
        </header>
        <div className="campaign-progress-copy">
          <strong>Daily Campaign</strong>
          <b>
            {todaySessions} / {target}
          </b>
        </div>
        <div
          className="campaign-progress-track"
          aria-label={`${Math.round(progress)} percent complete`}
        >
          <div style={{ width: `${progress}%` }} />
        </div>
        <p>Complete {target} focused watches to claim today&apos;s victory.</p>
      </article>

      <div className="metric-grid pixel-frame pixel-frame--parchment">
        <article>
          <span aria-hidden="true">❧</span>
          <small>Sessions</small>
          <strong>{todaySessions}</strong>
          <em>Today</em>
        </article>
        <article>
          <span aria-hidden="true">♨</span>
          <small>Disciplina</small>
          <strong>{disciplina.points}</strong>
          <em>{rank.name}</em>
        </article>
        <article>
          <span aria-hidden="true">⌛</span>
          <small>Focus Time</small>
          <strong>{compactDuration(todaySeconds)}</strong>
          <em>Today</em>
        </article>
        <article>
          <span aria-hidden="true">⌂</span>
          <small>Total Time</small>
          <strong>{compactDuration(totalSeconds)}</strong>
          <em>All time</em>
        </article>
      </div>

      <section className="weekly-summary pixel-frame pixel-frame--dark" aria-label="This week">
        <header>
          <span aria-hidden="true">▤</span>
          <h3>This Week</h3>
          <b>
            {compactDuration(weekSeconds)} · {weekCompleted} watches · {formation.percent}%
            formation
          </b>
        </header>
        <div className="weekly-bars">
          {weekDays.map((day) => (
            <div className="weekly-bar" key={day.key}>
              <div className="weekly-bar-track">
                <div
                  className="weekly-bar-fill"
                  style={{ height: `${Math.round((day.seconds / maxDaySeconds) * 100)}%` }}
                  aria-hidden="true"
                />
              </div>
              <small aria-hidden="true">{day.label}</small>
              <span className="sr-only">
                {day.label}: {compactDuration(day.seconds)}, {day.completed} watches
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
