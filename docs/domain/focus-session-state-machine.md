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
- If the system was sleeping, elapsed wall time counts as focus **by default**. Since v0.4.0 the watch notices a tick gap far larger than the tick interval and offers the user a choice: keep it as focus (the default — ignoring the offer changes nothing) or mark it as away, which accounts for the interval exactly like paused time. Detection alone never removes focus time.
- If stored state is invalid, preserve a recovery record and return to Idle rather than silently deleting it.

## Command idempotency

- START rejected unless Idle.
- PAUSE rejected unless Focusing.
- RESUME rejected unless Paused.
- COMPLETE produces one immutable record even if triggered twice.
