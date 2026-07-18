# VIGIL-001 Cross-Window Session Ownership — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Rust core the single authoritative owner of the active focus session so both the `main` and `companion` windows share one source of truth and neither reload spawns an independent timer.

**Architecture:** Rust holds `Mutex<SessionState>` (Tauri-managed). Windows mutate through `invoke` commands; every successful command emits `session://changed`, which Tauri broadcasts to all windows. The frontend store is dual-mode: under Tauri it routes mutations to Rust and mirrors event snapshots; in a plain browser (vite/Vitest/Playwright) it keeps today's local behaviour. Remaining time is timestamp-derived per ADR-003. Full decision: `docs/architecture/decisions/ADR-007-cross-window-session-ownership.md`.

**Tech Stack:** Rust + Tauri 2 (`tauri::Manager`, `app.emit`, `app.manage`, `tauri::State`), React 19 + Zustand 5, `@tauri-apps/api` (`invoke`, `event.listen`, `isTauri`).

## Global Constraints

- Rust passes `cargo fmt --check` and `cargo clippy -- -D warnings` before release.
- Timer is timestamp-derived, never a decrement-only counter (ADR-003).
- Companion must never own an independent authoritative session.
- TypeScript strict; boundary data (the IPC snapshot) is parsed/validated, not asserted.
- Source file names are kebab-case; component/type identifiers stay PascalCase.
- Custom commands need no extra capability; `session://changed` uses `core:event:default` (already in `core:default`). CSP stays `null` (VIGIL-003 owns the CSP gate).
- Every behaviour change ships tests or a documented test-debt note.

## Environment note

`cargo`/`rustc` and `tauri dev` were unavailable in the authoring sandbox, so Rust tasks (1–2) and the cross-window acceptance (Task 7) MUST be run where the Tauri toolchain exists. Frontend tasks (3–6) verify with `npm run check`.

---

### Task 1: Authoritative session state + pure transitions (Rust)

**Files:**

- Create: `src-tauri/src/session.rs`
- Test: same file, `#[cfg(test)] mod tests`

**Interfaces:**

- Produces: `Phase` (`Idle|Focusing|Paused|Complete`), `SessionState`, `SessionSnapshot`, `SessionError`, and methods `SessionState::idle()`, `start(&mut self, mission, victory, planned_secs, now_ms) -> Result<(), SessionError>`, `pause(now_ms)`, `resume(now_ms)`, `complete(now_ms)`, `reset()`, `snapshot(&self) -> SessionSnapshot`, `remaining_secs(&self, now_ms) -> u64`.

- [ ] **Step 1: Write failing tests**

```rust
// src-tauri/src/session.rs  (tests module)
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn start_from_idle_enters_focusing_and_stamps_start() {
        let mut s = SessionState::idle();
        s.start("Ship slice".into(), String::new(), 1500, 1_000).unwrap();
        assert_eq!(s.phase, Phase::Focusing);
        assert_eq!(s.started_at_ms, Some(1_000));
        assert_eq!(s.remaining_secs(1_000), 1500);
        assert_eq!(s.remaining_secs(61_000), 1440); // 60s elapsed
    }

    #[test]
    fn start_rejected_unless_idle_or_complete() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 1500, 0).unwrap();
        assert!(matches!(s.start("b".into(), String::new(), 1500, 5), Err(SessionError::InvalidTransition)));
    }

    #[test]
    fn pause_then_resume_excludes_paused_time_from_elapsed() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 1500, 0).unwrap();
        s.pause(60_000).unwrap();           // 60s focused
        assert_eq!(s.phase, Phase::Paused);
        s.resume(120_000).unwrap();          // paused 60s
        assert_eq!(s.total_paused_ms, 60_000);
        assert_eq!(s.remaining_secs(180_000), 1380); // 180s wall - 60s paused = 120s focused -> 1500-120
    }

    #[test]
    fn pause_rejected_when_not_focusing() {
        let mut s = SessionState::idle();
        assert!(matches!(s.pause(1), Err(SessionError::InvalidTransition)));
    }

    #[test]
    fn complete_is_idempotent() {
        let mut s = SessionState::idle();
        s.start("a".into(), String::new(), 1500, 0).unwrap();
        s.complete(10_000).unwrap();
        assert_eq!(s.phase, Phase::Complete);
        assert!(matches!(s.complete(11_000), Err(SessionError::InvalidTransition)));
    }
}
```

- [ ] **Step 2: Run tests, verify they fail** — `cargo test --manifest-path src-tauri/Cargo.toml session` → FAIL (types not defined).

- [ ] **Step 3: Implement the module**

```rust
// src-tauri/src/session.rs
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase { Idle, Focusing, Paused, Complete }

#[derive(Debug, PartialEq, Eq)]
pub enum SessionError { InvalidTransition }

#[derive(Clone, Debug)]
pub struct SessionState {
    pub phase: Phase,
    pub mission_title: String,
    pub victory_condition: String,
    pub planned_duration_secs: u64,
    pub started_at_ms: Option<i64>,
    pub total_paused_ms: i64,
    pub pause_started_at_ms: Option<i64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSnapshot {
    pub phase: Phase,
    pub mission_title: String,
    pub victory_condition: String,
    pub planned_duration_secs: u64,
    pub started_at_ms: Option<i64>,
    pub total_paused_ms: i64,
    pub pause_started_at_ms: Option<i64>,
    pub remaining_secs: u64,
}

impl SessionState {
    pub fn idle() -> Self {
        Self { phase: Phase::Idle, mission_title: String::new(), victory_condition: String::new(),
            planned_duration_secs: 0, started_at_ms: None, total_paused_ms: 0, pause_started_at_ms: None }
    }

    pub fn start(&mut self, mission: String, victory: String, planned_secs: u64, now_ms: i64) -> Result<(), SessionError> {
        if !matches!(self.phase, Phase::Idle | Phase::Complete) { return Err(SessionError::InvalidTransition); }
        self.phase = Phase::Focusing;
        self.mission_title = mission;
        self.victory_condition = victory;
        self.planned_duration_secs = planned_secs;
        self.started_at_ms = Some(now_ms);
        self.total_paused_ms = 0;
        self.pause_started_at_ms = None;
        Ok(())
    }

    pub fn pause(&mut self, now_ms: i64) -> Result<(), SessionError> {
        if self.phase != Phase::Focusing { return Err(SessionError::InvalidTransition); }
        self.phase = Phase::Paused;
        self.pause_started_at_ms = Some(now_ms);
        Ok(())
    }

    pub fn resume(&mut self, now_ms: i64) -> Result<(), SessionError> {
        let Some(paused_at) = self.pause_started_at_ms else { return Err(SessionError::InvalidTransition); };
        if self.phase != Phase::Paused { return Err(SessionError::InvalidTransition); }
        self.total_paused_ms += now_ms - paused_at;
        self.pause_started_at_ms = None;
        self.phase = Phase::Focusing;
        Ok(())
    }

    pub fn complete(&mut self, _now_ms: i64) -> Result<(), SessionError> {
        if !matches!(self.phase, Phase::Focusing | Phase::Paused) { return Err(SessionError::InvalidTransition); }
        self.phase = Phase::Complete;
        self.pause_started_at_ms = None;
        Ok(())
    }

    pub fn reset(&mut self) { *self = SessionState::idle(); }

    pub fn remaining_secs(&self, now_ms: i64) -> u64 {
        let Some(started) = self.started_at_ms else { return self.planned_duration_secs; };
        let paused = self.total_paused_ms + match self.pause_started_at_ms { Some(p) => now_ms - p, None => 0 };
        let elapsed_ms = (now_ms - started - paused).max(0);
        let elapsed_secs = (elapsed_ms / 1000) as u64;
        self.planned_duration_secs.saturating_sub(elapsed_secs)
    }

    pub fn snapshot(&self, now_ms: i64) -> SessionSnapshot {
        SessionSnapshot {
            phase: self.phase, mission_title: self.mission_title.clone(),
            victory_condition: self.victory_condition.clone(),
            planned_duration_secs: self.planned_duration_secs, started_at_ms: self.started_at_ms,
            total_paused_ms: self.total_paused_ms, pause_started_at_ms: self.pause_started_at_ms,
            remaining_secs: self.remaining_secs(now_ms),
        }
    }
}
```

- [ ] **Step 4: Run tests, verify pass** — `cargo test --manifest-path src-tauri/Cargo.toml session` → PASS. Then `cargo fmt` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`.

- [ ] **Step 5: Commit** — `git add src-tauri/src/session.rs && git commit -m "feat(session): authoritative session state + transitions [VIGIL-001]"`

---

### Task 2: Commands + event broadcast (Rust)

**Files:**

- Modify: `src-tauri/src/lib.rs`

**Interfaces:**

- Consumes: `session::{SessionState, SessionSnapshot}` from Task 1.
- Produces IPC commands: `session_get() -> SessionSnapshot`, `session_start(missionTitle, victoryCondition, plannedDurationSecs) -> Result<SessionSnapshot, String>`, `session_pause/resume/complete/reset() -> Result<SessionSnapshot, String>`; event `session://changed` (payload = `SessionSnapshot`).

- [ ] **Step 1: Add managed state + helper**

```rust
// src-tauri/src/lib.rs  (additions)
mod session;
use session::{SessionState, SessionSnapshot};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64
}

fn broadcast(app: &tauri::AppHandle, snap: &SessionSnapshot) {
    let _ = app.emit("session://changed", snap);
}
```

- [ ] **Step 2: Add the six commands**

```rust
#[tauri::command]
fn session_get(state: tauri::State<'_, Mutex<SessionState>>) -> SessionSnapshot {
    state.lock().unwrap().snapshot(now_ms())
}

#[tauri::command]
fn session_start(app: tauri::AppHandle, state: tauri::State<'_, Mutex<SessionState>>,
    mission_title: String, victory_condition: String, planned_duration_secs: u64) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let mut s = state.lock().unwrap();
    s.start(mission_title, victory_condition, planned_duration_secs, now).map_err(|_| "invalid transition".to_string())?;
    let snap = s.snapshot(now);
    drop(s);
    broadcast(&app, &snap);
    Ok(snap)
}
// session_pause / session_resume / session_complete follow the same shape,
// calling s.pause(now)/s.resume(now)/s.complete(now).
// session_reset calls s.reset() (infallible) then broadcasts.
```

- [ ] **Step 3: Register state + handlers in `run()`**

```rust
tauri::Builder::default()
    .setup(|app| { app.manage(Mutex::new(SessionState::idle())); Ok(()) })
    .invoke_handler(tauri::generate_handler![
        show_companion, hide_companion, set_companion_click_through,
        minimize_main, toggle_maximize_main, close_main,
        session_get, session_start, session_pause, session_resume, session_complete, session_reset
    ])
    // ...
```

- [ ] **Step 4: Verify** — `cargo build --manifest-path src-tauri/Cargo.toml`, `cargo clippy ... -- -D warnings`, `cargo fmt --check`.
- [ ] **Step 5: Commit** — `git commit -am "feat(session): IPC commands + session://changed broadcast [VIGIL-001]"`

---

### Task 3: Frontend session bridge (isTauri-guarded IPC)

**Files:**

- Create: `src/shared/lib/session-bridge.ts`

**Interfaces:**

- Consumes: the `session_*` commands and `session://changed` event from Task 2.
- Produces: `SessionSnapshot` (Zod-parsed type), `isTauri()`, `getSession()`, `startSession(args)`, `pauseSession()`, `resumeSession()`, `completeSession()`, `resetSession()`, `subscribeSession(cb): Promise<UnlistenFn>`.

- [ ] **Step 1:** Implement. Mirror `native-bridge.ts`'s guard. Parse the snapshot with a Zod schema (strict boundary parsing). In non-Tauri, `getSession()` resolves `null` and `subscribeSession` returns a no-op unlisten.

```ts
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { z } from 'zod';

export const sessionSnapshotSchema = z.object({
  phase: z.enum(['idle', 'focusing', 'paused', 'complete']),
  missionTitle: z.string(),
  victoryCondition: z.string(),
  plannedDurationSecs: z.number(),
  startedAtMs: z.number().nullable(),
  totalPausedMs: z.number(),
  pauseStartedAtMs: z.number().nullable(),
  remainingSecs: z.number(),
});
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;

export { isTauri };
export async function getSession(): Promise<SessionSnapshot | null> {
  if (!isTauri()) return null;
  return sessionSnapshotSchema.parse(await invoke('session_get'));
}
export async function startSession(a: {
  missionTitle: string;
  victoryCondition: string;
  plannedDurationSecs: number;
}) {
  if (!isTauri()) return null;
  return sessionSnapshotSchema.parse(await invoke('session_start', a));
}
// pause/resume/complete/reset: invoke('session_pause') etc., same parse.
export async function subscribeSession(cb: (s: SessionSnapshot) => void): Promise<UnlistenFn> {
  if (!isTauri()) return () => {};
  return listen('session://changed', (e) => cb(sessionSnapshotSchema.parse(e.payload)));
}
```

- [ ] **Step 2: Verify** — `npm run typecheck`. **Step 3: Commit** — `git commit -am "feat(session): typed isTauri-guarded session bridge [VIGIL-001]"`

---

### Task 4: Store dual-mode refactor

**Files:**

- Modify: `src/features/focus-session/model/use-focus-store.ts`
- Test: `src/widgets/main-shell/main-shell.test.tsx` stays green (browser mode)

**Interfaces:**

- Consumes: `session-bridge` from Task 3.
- Produces: `applySnapshot(snap)` action; `initSessionSync()` (idempotent; under Tauri calls `getSession()` then `subscribeSession(applySnapshot)`).

- [ ] **Step 1:** Add `applySnapshot` mapping snapshot → store fields (phase, missionTitle, remainingSeconds, plannedDurationSeconds, startedAtMs, totalPausedMs). Under `isTauri()`, `startSession/pauseSession/resumeSession/completeSession/resetSession` call the bridge command and let the returned/broadcast snapshot drive state via `applySnapshot` (do NOT mutate phase/timestamps locally). In browser, keep the existing local logic unchanged.
- [ ] **Step 2:** Add `initSessionSync()`; call it once from `src/main.tsx` after render. Guard against double-subscribe.
- [ ] **Step 3: Verify** — `npm run check` (7 existing tests stay green because jsdom is non-Tauri → local path). Add one test: `applySnapshot` maps a snapshot to store fields.
- [ ] **Step 4: Commit** — `git commit -am "feat(session): dual-mode store driven by authoritative snapshots [VIGIL-001]"`

---

### Task 5: Companion renders from shared authority

**Files:**

- Modify: `src/widgets/companion-overlay/companion-overlay.tsx`

- [ ] **Step 1:** Keep the display interval that recomputes remaining from `startedAtMs`, but confirm its `pause/resume/complete` handlers go through the store (which, under Tauri, routes to Rust). Remove any path where the companion mutates authoritative phase locally under Tauri. Under Tauri the companion is now a pure mirror + command sender.
- [ ] **Step 2: Verify** — `npm run check`. **Step 3: Commit** — `git commit -am "feat(companion): render from authoritative session, no independent timer [VIGIL-001]"`

---

### Task 6: Event catalog doc

**Files:**

- Modify: `docs/domain/event-catalog.md`

- [ ] **Step 1:** Add `session://changed` (payload `SessionSnapshot`, emitted by Rust after every session command, consumed by both windows). **Step 2: Commit.**

---

### Task 7: Cross-window acceptance (manual, requires `tauri dev`)

- [ ] Run `npm run tauri:dev`.
- [ ] In `main`, start a session → the `companion` window's mission + countdown update within ~1s (acceptance 1).
- [ ] Reload the `companion` webview (DevTools reload) → it re-hydrates the same session and countdown; no second/independent timer (acceptance 2).
- [ ] Pause in `companion` → `main` reflects Paused. Reload `main` → same session.
- [ ] Record the result; if green, mark VIGIL-001 acceptance met (ADR-007 already recorded — acceptance 3).

## Self-Review

- **Spec coverage:** acceptance 1 (Task 2 broadcast + Task 4 mirror + Task 7), acceptance 2 (Task 4 `getSession` on init + Task 7), acceptance 3 (ADR-007). Invariant (Rust authoritative) — Tasks 1–2. Companion no independent session — Task 5. ✓
- **Placeholders:** none — Rust module and bridge are complete; pause/resume/complete commands explicitly follow the shown `session_start` shape.
- **Type consistency:** snapshot fields are camelCase across Rust `#[serde(rename_all = "camelCase")]`, the Zod schema, and `applySnapshot`. `Phase` lowercase matches the store's phase strings. ✓
