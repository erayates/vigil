# Five-user v0.1 Usability Test

This is the VIGIL-012 exit gate. Run it with five participants on the real app
(`npm run tauri:dev` or a build), one at a time, no facilitator help during the task.

## Task

> "Use VIGIL to work for five minutes on a real task. Define what success means,
> begin, pause once, resume, then complete the session. Then imagine you had to
> stop early instead — how would you do that?"

Use a short custom duration (e.g. 2 minutes) so the watch completes within the session.

## Observe (per participant)

- Time from app open to first Start (target: median < 60s).
- Whether the primary mission and Start are found without help (target: ≥ 80%).
- Whether "victory condition" is understood.
- Whether the companion window blocks content or distracts.
- Whether pause/resume is discoverable.
- Whether completion state is clear.
- Whether **Abandon watch** (give up early) is found and understood.
- If the companion ever stops responding to the mouse, whether **Recall companion**
  (main dashboard) is discovered as the fix.
- Whether the user wants the timer always visible.

## Questions

1. What did the companion help you remember?
2. Was any movement distracting?
3. What did "victory condition" mean to you?
4. Where would you place the companion?
5. Would you use another session tomorrow? Why?

## Pass thresholds (from the MVP PRD success measures)

- ≥ 70% of started sessions reach completion or intentional early completion.
- ≥ 80% identify the primary mission and Start without facilitator help.
- Median open-to-start under 60 seconds.
- ≥ 70% report the companion is neutral or helpful, not distracting.
- ≥ 60% say they would start a second session.

## Findings log (required — VIGIL-012 acceptance)

Record every issue; classify severity; resolve or mark release-blocking before v0.1.0.

| #   | Participant | Observation | Severity (P0/P1/P2/P3) | Resolution / decision |
| --- | ----------- | ----------- | ---------------------- | --------------------- |
|     |             |             |                        |                       |

- **P0** — blocks the core loop or loses data → release-blocking.
- **P1** — significant friction on the core loop → resolve or explicitly defer with rationale.
- **P2/P3** — polish → backlog.

Exit is met when five sessions are observed, findings are logged with severity, and
no unresolved P0/P1 remains (per `docs/roadmap/phases/P1-v0.1-vertical-slice.md`).
