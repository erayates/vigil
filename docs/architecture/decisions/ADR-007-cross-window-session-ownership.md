# ADR-007: Cross-window authoritative session ownership

**Status:** Accepted (spike — VIGIL-001, v0.0.4)

## Context

VIGIL runs two webview windows (`main`, `companion`) from the same origin. The
prototype keeps the active session in a per-window Zustand store persisted to
`localStorage`. Because each webview has its own JavaScript context, each window
owns an independent copy of the session and — critically — the companion runs
its **own** `tick()` interval (`companion-overlay.tsx`). Two independent timers
drift, and reloading either webview spawns a fresh timer. This violates two
standing invariants:

- the companion "must never own an independent authoritative session"
  (`system-architecture.md`),
- "the Rust/application layer owns the authoritative active-session lifecycle by
  v0.1.0" — current Zustand persistence is an explicit prototype bridge.

VIGIL-001 must prove one source of truth shared by both windows, guarantee that
reloading a webview does not create an independent timer, and record the
decision here.

## Decision

The **Rust core is the single authoritative owner** of the active session.

- Rust holds `Mutex<SessionState>` as Tauri-managed state. `SessionState` uses
  the ADR-003 timestamp model: `phase`, `mission_title`, `victory_condition`,
  `planned_duration_secs`, `started_at_ms?`, `total_paused_ms`,
  `pause_started_at_ms?`. Remaining time is **derived**, never stored.
- Mutations are IPC commands: `session_get`, `session_start`, `session_pause`,
  `session_resume`, `session_complete`, `session_reset`. Each successful command
  emits `session://changed` with the full snapshot; Tauri broadcasts it to every
  window.
- The frontend is **dual-mode**, guarded by the existing `isTauri` pattern
  (`native-bridge.ts`):
  - under Tauri, store mutations call Rust commands and the store is a **mirror**
    updated only by `session://changed`; the companion loses its tick ownership
    and renders the countdown derived from the shared `started_at_ms`;
  - in a plain browser (vite dev, Playwright, Vitest) there is no Rust core, so
    the store keeps today's local behaviour. Existing tests and browser dev stay
    green.
- Display remains timestamp-derived per ADR-003: both windows compute
  `remaining` from the shared authoritative `started_at_ms`, so they agree, and a
  reload re-hydrates via `session_get` instead of starting a new timer.

## Scope (this spike)

In scope: the ownership mechanism and the core lifecycle
(start/pause/resume/complete/reset) sufficient to prove both acceptance
criteria.

Deferred:

- `Preparing` / `Debrief` / `Abandoned` states and full transition
  validation/idempotency → VIGIL-004. The spike's `session_start` goes straight
  to `Focusing`.
- Durable persistence (SQLite) → VIGIL-002 / VIGIL-005. Spike state is in-memory
  and is lost on a full process restart; restart recovery is VIGIL-007.
- Completion at zero is triggered by whichever window observes `remaining == 0`
  calling `session_complete`; a Rust idempotency guard keeps it single.

## Consequences

- Satisfies the invariant and de-risks VIGIL-004 (state machine) and VIGIL-006
  (companion synchronisation), which build directly on this core.
- Cost: dual-mode branching in the store, and the authoritative state is
  in-memory until the SQLite work lands.
- Security: custom `invoke` commands need no extra capability; `session://changed`
  uses `core:event:default` already granted via `core:default`. CSP stays `null`
  here; the restrictive-CSP gate is tracked separately (VIGIL-003).

## Alternatives considered

- **Frontend broadcast (main owns, emits to companion).** Smaller, but leaves the
  authoritative session in the UI, contradicting the invariant and requiring
  rework at VIGIL-004; main-window reload would still depend on `localStorage`.
- **ADR-only relay proof.** Document the decision and prove Tauri's cross-window
  event broadcast with a throwaway counter. Rejected: proves the channel but not
  a real shared session, leaving all the risk in VIGIL-004/006.
