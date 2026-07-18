# ADR-011: OS integration — notification, global shortcut, autostart

## Status

Accepted — VIGIL-018 / VIGIL-019 / VIGIL-020 (v0.2.0).

## Context

The daily-use alpha wants three OS integrations: a completion notification, a
global recovery shortcut, and opt-in launch-at-login. Each has an official
Tauri v2 plugin (`tauri-plugin-notification`, `tauri-plugin-global-shortcut`,
`tauri-plugin-autostart`), added as cargo + npm dependencies.

## Decision

- **Notification (019):** fire exactly one native notification from the Rust
  `session_complete` command — authoritative, so neither window duplicates it. A
  denied OS permission simply fails `show()`, which is ignored (graceful).
- **Global shortcut (018):** register `Ctrl+Shift+V` in Rust `setup`; on press it
  recovers the companion (show + click-through off) and surfaces the main window —
  the recovery path VIGIL-009 deferred. Registration is best-effort: a conflict is
  logged, not fatal.
- **Autostart (020):** off by default; toggled from a tray **Launch at login**
  check item through the plugin's autolaunch manager. The OS holds the state (it
  persists across restarts); the tray item reflects `is_enabled()` at startup.
- **Capabilities:** all three are wired in the Rust backend (plugin init + backend
  calls), never from the webview, so **no frontend capability is granted** — the
  least-privilege choice. If runtime shows a plugin needs a capability, add only
  that specific permission.

## Consequences

- Behaviour (toast rendering, the shortcut firing while unfocused, login
  registration) is runtime-only and verified through `tauri:dev`; the wiring is
  compile-verified (`cargo clippy -D warnings`).
- The npm plugin packages are installed for parity and possible future frontend
  use, but are currently unused because the integration is backend-wired.
