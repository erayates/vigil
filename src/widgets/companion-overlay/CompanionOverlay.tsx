import { useEffect, useState } from 'react';
import { formatDuration } from '@/entities/focus-session/lib/time';
import { useFocusStore } from '@/features/focus-session/model/useFocusStore';
import { nativeBridge } from '@/shared/lib/nativeBridge';
import { PixelCompanion } from '@/widgets/pixel-companion/PixelCompanion';
import '@/widgets/pixel-companion/pixel-companion.css';
import './companion-overlay.css';

export function CompanionOverlay() {
  const {
    phase,
    missionTitle,
    remainingSeconds,
    pauseSession,
    resumeSession,
    completeSession,
    tick,
  } = useFocusStore();
  const [clickThrough, setClickThrough] = useState(false);

  useEffect(() => {
    if (phase !== 'focusing') return;
    tick();
    const intervalId = window.setInterval(() => tick(), 250);
    return () => window.clearInterval(intervalId);
  }, [phase, tick]);

  return (
    <main className="overlay-root">
      <div className="overlay-card">
        <div className="drag-handle" data-tauri-drag-region>
          VIGIL
        </div>
        <PixelCompanion phase={phase} size="small" />
        <strong className="overlay-mission">{missionTitle || 'Awaiting orders'}</strong>
        <div className="overlay-time">{formatDuration(remainingSeconds)}</div>
        <div className="overlay-actions">
          {phase === 'focusing' ? (
            <button type="button" onClick={pauseSession} aria-label="Pause focus session">
              II
            </button>
          ) : null}
          {phase === 'paused' ? (
            <button type="button" onClick={resumeSession} aria-label="Resume focus session">
              &gt;
            </button>
          ) : null}
          {['focusing', 'paused'].includes(phase) ? (
            <button type="button" onClick={completeSession} aria-label="Complete focus session">
              ✓
            </button>
          ) : null}
          <button
            type="button"
            aria-pressed={clickThrough}
            title="Toggle click-through"
            onClick={() => {
              const next = !clickThrough;
              setClickThrough(next);
              void nativeBridge.setCompanionClickThrough(next);
            }}
          >
            ◇
          </button>
        </div>
      </div>
    </main>
  );
}
