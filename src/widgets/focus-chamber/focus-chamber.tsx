import { useEffect, useRef } from 'react';
import { describeDuration, formatDuration } from '@/entities/focus-session/lib/time';
import { useFocusStore } from '@/features/focus-session/model/use-focus-store';
import { nativeBridge } from '@/shared/lib/native-bridge';
import { DebriefForm } from './debrief-form';

function phaseCopy(phase: ReturnType<typeof useFocusStore.getState>['phase']): string {
  switch (phase) {
    case 'preparing':
      return 'Forming the line…';
    case 'focusing':
      return 'Stay focused. Build your empire.';
    case 'paused':
      return 'Formation held. Resume when ready.';
    case 'complete':
      return 'Watch complete. Debrief the result.';
    case 'abandoned':
      return 'Watch ended early. Log what happened.';
    case 'debrief':
      return 'Log the outcome and your next move.';
    case 'break':
      return 'On a break. Recover, then return.';
    default:
      return 'Define one mission, then hold the line.';
  }
}

export function FocusChamber() {
  const {
    missionTitle,
    phase,
    remainingSeconds,
    plannedDurationSeconds,
    startSession,
    pauseSession,
    resumeSession,
    resetSession,
    abandonSession,
    openDebrief,
    recordDebrief,
    endBreak,
    pendingGapMs,
    keepGapAsFocus,
    excludeGap,
    tick,
  } = useFocusStore();

  useEffect(() => {
    if (phase !== 'focusing' && phase !== 'break') return;
    tick();
    const intervalId = window.setInterval(() => tick(), 250);
    return () => window.clearInterval(intervalId);
  }, [phase, tick]);

  // Tuck the companion away when a break ends — whether it elapses on its own or
  // is ended manually. Keyed on the break→idle transition, so it never fights the
  // "Recall companion" control (which shows the companion while already idle).
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current === 'break' && phase === 'idle') {
      void nativeBridge.hideCompanion();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const elapsedPercent = Math.max(
    0,
    Math.min(100, ((plannedDurationSeconds - remainingSeconds) / plannedDurationSeconds) * 100),
  );

  function handlePrimaryAction() {
    if (phase === 'idle') {
      startSession();
      void nativeBridge.showCompanion();
      return;
    }
    if (phase === 'paused') {
      resumeSession();
      return;
    }
    if (phase === 'complete' || phase === 'abandoned') {
      openDebrief();
    }
  }

  const primaryLabel =
    phase === 'paused'
      ? 'Resume'
      : phase === 'complete' || phase === 'abandoned'
        ? 'Debrief'
        : 'Start';
  const primaryDisabled =
    phase === 'preparing' ||
    phase === 'focusing' ||
    phase === 'break' ||
    phase === 'debrief' ||
    (phase === 'idle' && missionTitle.trim().length === 0);

  return (
    <section
      className="focus-chamber pixel-frame pixel-frame--parchment"
      aria-labelledby="focus-time-title"
    >
      <header className="focus-ribbon">
        <span aria-hidden="true">◆</span>
        <h2 id="focus-time-title">Focus Time</h2>
        <span aria-hidden="true">◆</span>
      </header>

      <div className="laurel-timer">
        <span className="laurel laurel--left" aria-hidden="true">
          ❧
        </span>
        {/* Not a live region: the countdown must never be announced every second. */}
        <time aria-label={`${describeDuration(remainingSeconds)} remaining`}>
          {formatDuration(remainingSeconds)}
        </time>
        <span className="laurel laurel--right" aria-hidden="true">
          ❧
        </span>
      </div>

      <div className="timer-rule" aria-hidden="true">
        <span />
      </div>
      <p className="focus-motto" role="status">
        {phaseCopy(phase)}
      </p>
      <p className="active-order-label">{missionTitle || 'Awaiting a campaign order'}</p>

      <div className="focus-progress" aria-label={`${Math.round(elapsedPercent)} percent elapsed`}>
        <div style={{ width: `${elapsedPercent}%` }} />
      </div>

      {pendingGapMs !== null && (
        <div className="gap-prompt" role="status">
          <span>
            This machine was away for about {Math.max(1, Math.round(pendingGapMs / 60000))} min
            during the watch. Count it as focus?
          </span>
          <div className="gap-prompt-actions">
            <button type="button" onClick={keepGapAsFocus}>
              Count as focus
            </button>
            <button type="button" onClick={excludeGap}>
              I was away
            </button>
          </div>
        </div>
      )}

      {phase === 'debrief' ? (
        <DebriefForm
          onRecord={(fields) => {
            recordDebrief(fields);
            void nativeBridge.hideCompanion();
          }}
          onSkip={() => {
            resetSession();
            void nativeBridge.hideCompanion();
          }}
        />
      ) : phase === 'break' ? (
        <div className="break-controls">
          <button
            className="control-button control-button--start"
            type="button"
            onClick={() => endBreak()}
          >
            <span className="control-icon" aria-hidden="true">
              ✔
            </span>
            <strong>End break</strong>
          </button>
        </div>
      ) : (
        <>
          <div className="focus-controls">
            <button
              className="control-button control-button--start"
              type="button"
              disabled={primaryDisabled}
              onClick={handlePrimaryAction}
            >
              <span className="control-icon" aria-hidden="true">
                ▶
              </span>
              <strong>{primaryLabel}</strong>
            </button>
            <button
              className="control-button control-button--pause"
              type="button"
              disabled={phase !== 'focusing'}
              onClick={pauseSession}
            >
              <span className="control-icon" aria-hidden="true">
                Ⅱ
              </span>
              <strong>Pause</strong>
            </button>
            <button
              className="control-button control-button--reset"
              type="button"
              disabled={!['idle', 'complete', 'abandoned'].includes(phase)}
              onClick={resetSession}
            >
              <span className="control-icon" aria-hidden="true">
                ↻
              </span>
              <strong>Reset</strong>
            </button>
          </div>

          {(phase === 'focusing' || phase === 'paused') && (
            <button className="abandon-watch" type="button" onClick={abandonSession}>
              Abandon watch
            </button>
          )}
        </>
      )}
    </section>
  );
}
