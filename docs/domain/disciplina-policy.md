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

## All-time accuracy

Disciplina points and Total Time are computed from a **Rust aggregate over the
whole database** (`repository::lifetime_stats`, exposed as the `session_stats`
command), not from the capped recent-record list. So they keep counting
correctly however many sessions accumulate — past the point where the recent
list stops returning every row.

The dashboard feeds those authoritative totals through `disciplinaFromTotals`,
which is the same formula as `calculateDisciplina`, just given the aggregate
counts instead of re-deriving them from records. A plain browser (no Rust core)
has no aggregate and falls back to the local history.

The **weekly** and **today** panels still derive from the recent list, which is
correct in practice: they only look at a 7-day window, and exceeding ~50 finished
sessions inside seven days is not a real usage pattern.

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
