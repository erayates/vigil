# ADR-001: Tauri 2 with React and TypeScript

**Status:** Accepted  
**Decision version:** 0.0.1

## Context

VIGIL requires a small always-on-top transparent companion, native window controls and a modern UI development workflow.

## Decision

Use Tauri 2 as the desktop shell and React + TypeScript + Vite for webview UI.

## Consequences

- Native concerns remain explicit in Rust/Tauri adapters.
- Frontend can reuse established component tooling.
- Windows development requires Rust, Microsoft C++ Build Tools and WebView2.
- Tauri capability permissions must be maintained deliberately.
