import { useEffect, useState } from 'react';
import { formatDuration } from '@/entities/focus-session/lib/time';
import { useCompanionPrefsStore } from '@/features/companion/model/use-companion-prefs-store';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { nativeBridge } from '@/shared/lib/native-bridge';
import { PixelCompanion } from '@/widgets/pixel-companion/pixel-companion';
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
  const { scale, opacity } = useCompanionPrefsStore();
  const [clickThrough, setClickThrough] = useState(false);

  useEffect(() => {
    // Count down during both the focus watch and a break.
    if (phase !== 'focusing' && phase !== 'break') return;
    tick();
    const intervalId = window.setInterval(() => tick(), 250);
    return () => window.clearInterval(intervalId);
  }, [phase, tick]);

  // The companion window is hidden outside a watch, but WebView2 keeps painting
  // it — a sprite animating behind a hidden window cost measurable CPU all day.
  // Park it whenever there is nothing to watch. See docs/quality/idle-resource-budget.md.
  useEffect(() => {
    const watching = phase === 'focusing' || phase === 'break' || phase === 'paused';
    document.documentElement.classList.toggle('is-window-unfocused', !watching);
  }, [phase]);

  return (
    <main
      className="overlay-root"
      style={{ opacity, transform: `scale(${scale})`, transformOrigin: 'top center' }}
    >
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
