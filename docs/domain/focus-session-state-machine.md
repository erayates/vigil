# Focus Session State Machine

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Preparing: START(mission, duration)
  Preparing --> Focusing: PREPARATION_FINISHED
  Preparing --> Idle: CANCEL
  Focusing --> Paused: PAUSE
  Paused --> Focusing: RESUME
  Focusing --> Complete: TIMER_ELAPSED
  Focusing --> Complete: COMPLETE_EARLY
  Paused --> Complete: COMPLETE_EARLY
  Focusing --> Abandoned: ABANDON
  Paused --> Abandoned: ABANDON
  Complete --> Debrief: OPEN_DEBRIEF
  Abandoned --> Debrief: CAPTURE_REASON
  Debrief --> Idle: RECORD
```

## Timing model

Never use a decrement-only counter as source of truth.

```text
activeElapsed = now - startedAt - sum(pausedIntervals)
remaining = max(0, plannedDuration - activeElapsed)
```

## Recovery rules

- On restart, load active session and recompute from timestamps.
- If the system was sleeping, elapsed wall time counts as focus by default for v0.1.0; v0.2.0 may detect suspend/resume and ask the user to classify the interval.
- If stored state is invalid, preserve a recovery record and return to Idle rather than silently deleting it.

## Command idempotency

- START rejected unless Idle.
- PAUSE rejected unless Focusing.
- RESUME rejected unless Paused.
- COMPLETE produces one immutable record even if triggered twice.
