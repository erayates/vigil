# ADR-010: System tray and close-to-tray

## Status

Accepted — VIGIL-017 (v0.2.0).

## Context

The companion window can be made click-through, and VIGIL-009 shipped an in-app
"Recall companion" control while deferring the tray/global-shortcut recovery path
to v0.2.0. A system tray gives an always-available way to show/hide the companion
and recover interaction, and lets the app keep running when the main window is
closed — both expected of a desktop focus companion.

## Decision

- Create a **backend** system tray in `setup` (Tauri `tray-icon` cargo feature,
  already enabled) with a menu:
  - **Show companion** — shows it and disables click-through (this closes the
    tray recovery path VIGIL-009 deferred).
  - **Hide companion**.
  - **Open VIGIL** — shows and focuses the main window (also the left-click action).
  - **Close to tray** — a checkable item bound to a persisted preference.
  - **Quit** — exits the app.
- **Close-to-tray** is a persisted preference (`settings.close_to_tray`, default
  **off**). When on, the main window's `CloseRequested` is intercepted
  (`prevent_close` + `hide`); when off, closing quits as usual. It is toggled from
  the tray's check item and read fresh on each close.
- The tray is created in Rust, not from the webview, so **no additional capability
  is required**: capabilities gate webview→core calls, and both the tray and its
  menu handlers are backend code invoking Rust window APIs. The tray icon reuses
  the bundle window icon; if none is available the tray is skipped and the in-app
  "Recall companion" control remains the recovery path.

## Consequences

- Recovering a click-through companion no longer depends solely on the main window.
- Tray behaviour (icon rendering, menu actions, left-click, close-to-tray) is
  runtime-only and verified through `tauri:dev`, not automated tests. The
  close-to-tray preference and its persistence are unit-tested.
- Global shortcut and native notification (VIGIL-018/019) remain separate,
  plugin-backed tasks and are out of scope here.
