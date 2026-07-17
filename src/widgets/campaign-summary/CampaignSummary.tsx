import { useMemo } from 'react';
import { useFocusStore } from '@/features/focus-session/model/useFocusStore';

function compactDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function CampaignSummary() {
  const history = useFocusStore((state) => state.history);
  const { todaySessions, todaySeconds, totalSeconds } = useMemo(() => {
    const today = new Date().toDateString();
    const todayRecords = history.filter(
      (record) => new Date(record.completedAtIso).toDateString() === today,
    );
    return {
      todaySessions: todayRecords.length,
      todaySeconds: todayRecords.reduce((sum, record) => sum + record.focusedDurationSeconds, 0),
      totalSeconds: history.reduce((sum, record) => sum + record.focusedDurationSeconds, 0),
    };
  }, [history]);
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
          <small>Formation</small>
          <strong>—</strong>
          <em>v0.3.0</em>
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
    </section>
  );
}
