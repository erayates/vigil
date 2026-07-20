# Progression Guardrail Review (VIGIL-031)

Review of the v0.3.0 progression work (VIGIL-024 Disciplina, 025 Formation
Integrity, 026 Recovery Days, 027 Rank, 028 audit trail) against the P3 guardrails
in `docs/roadmap/phases/P3-v0.3-progression.md`.

Reviewed at v0.2.0+progression, before the art-dependent tasks (029 camp growth,
030 cosmetic equipment) are built.

## 1. No loot boxes, random or paid rewards, no loss-aversion timers

**Pass.**

- Disciplina is a deterministic formula (`completedWatches * 10 + focusedMinutes`)
  — `src/entities/focus-session/lib/disciplina.ts`. No randomness, no purchase.
- Rank uses fixed, published thresholds — `lib/rank.ts`.
- Formation Integrity is a deterministic ratio — `lib/formation.ts`.
- No countdown pressures progression: the only timers are the user-started focus
  watch and an optional break. Nothing expires, and nothing warns about losing a
  streak.
- The completion notification fires once, on a completed watch — it never nags.

## 2. Missed days never erase accumulated work

**Pass.**

- Disciplina has no date-based decay: it only accumulates from completed watches,
  so a missed day cannot reduce it (unit-tested).
- Rank derives from Disciplina, so it can only advance — never demote
  (unit-tested).
- Formation Integrity is deliberately _not_ accumulated work: it is a recent
  consistency indicator. One missed day lowers it by about one seventh — a gentle
  degrade, never a reset — and Recovery Days keep planned rest neutral.
- Session records are never deleted or rewritten by a missed day; abandoned
  sessions also keep their recorded focus time.

## 3. The mission remains visually dominant over progression

**Pass.**

- The focus chamber (mission title + large countdown) holds the centre of the
  dashboard; progression appears as one small metric in the bottom summary strip
  (Disciplina points + rank name), a small rank numeral on the companion banner,
  and a collapsed-by-default audit panel.
- Progression has no full-screen moment, animation, or interruption.

## 4. Progression derives only from accepted records

**Pass.** Every figure is computed from completed session records; the audit panel
(VIGIL-028) shows the derivation and lists the specific records behind it, so there
is no hidden or unexplained progression.

## Carry-forward for the art-dependent tasks

VIGIL-029 (camp growth) and VIGIL-030 (cosmetic equipment) must inherit the same
rules when built: derived from accepted records, never shrinking on a missed day,
and no random or paid unlocks.
