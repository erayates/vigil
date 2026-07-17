# ADR-008: Local persistence with SQLite (rusqlite)

**Status:** Accepted (spike — VIGIL-002, v0.0.4)

## Context

v0.1.0 needs durable local records — missions, focus sessions, pause intervals —
owned by the Rust/application core, with no cloud service (`system-architecture.md`,
`persistence.md`). VIGIL-002 proves the storage and migration mechanism before the
real repositories (VIGIL-005) depend on it.

## Decision

- **rusqlite** with the `bundled` feature: synchronous, embeds the SQLite C library
  (no system dependency), the simplest fit for a local desktop database owned by the
  Rust core.
- **rusqlite_migration**: numbered, forward-only migrations keyed on
  `PRAGMA user_version`, matching the migration rules in `persistence.md`.
- Schema follows `persistence.md` (missions / focus_sessions / pause_intervals);
  `PRAGMA foreign_keys = ON`.
- A `db` module exposes `migrations()` and `open(path)`, verified by an integration
  test: migrate a clean database, insert, read back, and re-migrate safely.

## Alternatives considered

- **tauri-plugin-sql**: exposes SQL to the JS/webview layer. Rejected — the domain
  core must own persistence, not the UI; this would repeat the ownership mistake
  ADR-007 just corrected for session state.
- **sqlx**: async with compile-time-checked queries. Heavier than a local desktop
  spike warrants (async runtime, a compile-time database or offline query cache).

## Scope (this spike) and consequences

- In scope: the schema, the forward-only migration mechanism, and one proven
  insert/query path.
- Deferred to VIGIL-005: opening the connection at startup, managing it as shared
  state, and the mission/session repositories that back the session commands.
- Security: a local file under the app data directory, no network. The `bundled`
  feature adds a self-contained native C build-time dependency compiled with the
  existing MSVC toolchain.
