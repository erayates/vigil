# Disciplina Policy

Disciplina is VIGIL's consistency measure. It exists to reflect accumulated real
work — never to punish, pressure, or replace it (see the P3 guardrails in
`docs/roadmap/phases/P3-v0.3-progression.md`).

## Calculation

Derived **only from completed watches** (accepted records):

```text
completedWatches = count of sessions with outcome = "completed"
focusedMinutes   = floor(sum of focusedDurationSeconds over completed sessions / 60)
points           = completedWatches * 10 + focusedMinutes
```

- **Non-punitive:** there is no date-based decay. A missed day never reduces
  Disciplina — it can only grow or hold.
- **Accepted records only:** abandoned sessions keep their recorded focus time in
  the history and totals, but earn no Disciplina (which tracks completions).
- **Not reward-first:** points derive from records, never from UI actions, and the
  mission stays visually dominant over progression.

## Known limitation

The current implementation derives Disciplina from the loaded session history,
which is capped (like the "Total Time" and weekly metrics). For long-term
accuracy a future task replaces these all-time metrics with a Rust aggregate over
every record; tracked as shared debt with the weekly-summary cap.

## Formation Integrity

A "streak without shame" (VIGIL-025): the share of the **last seven days** that had
at least one completed watch.

```text
activeDays = distinct days in the last 7 with a completed watch
percent    = round(activeDays / 7 * 100)
```

- A missed day lowers it by ~1/7 — a **gentle degrade**, never a reset to zero on a
  single miss — and it recovers as active days accumulate.
- It is only a recent-consistency indicator: it never touches Disciplina, rank or
  any accumulated work.

## Downstream

Rank (VIGIL-027) and camp growth (VIGIL-029) derive from Disciplina; they must
inherit the same non-punitive rules.
