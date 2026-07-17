# ADR-009: Per-window capabilities and a restrictive CSP

**Status:** Accepted (VIGIL-003, v0.0.4)

## Context

The scaffold granted a single broad `core:default` capability to both windows and
left the Content Security Policy unset (`csp: null`). The security standard
(`docs/development/coding-standards/security.md`) requires least-privilege
capabilities per window and a restrictive, tested CSP before `v0.1.0`.

## Decision

### Capabilities

Replace `default.json` with two per-window files:

- `main.json` (window `main`) and `companion.json` (window `companion`), each
  granting only:
  - `core:event:default` — the `session://changed` listener (ADR-007),
  - `core:window:allow-start-dragging` — the `data-tauri-drag-region` title bars.

All window controls, show/hide, click-through and session mutations are Rust-side
custom commands, which are not capability-gated, so they need no permission entry.
No shell, filesystem, or other broad permission is granted. The two windows share
the same minimal set today, but the split makes each window's grant independently
reviewable and lets them diverge without widening the other.

### CSP

- Production `csp`: `default-src 'self'` with `img-src 'self' data:`,
  `style-src 'self' 'unsafe-inline'`, `script-src 'self'`,
  `connect-src 'self' ipc: http://ipc.localhost`, `font-src 'self'`,
  `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. No remote
  scripts, fonts or UI assets.
- `devCsp` additionally allows Vite HMR: `'unsafe-inline' 'unsafe-eval'` for
  `script-src` and the `ws://localhost:1420` / `http://localhost:1420` dev origins.

## Consequences

- Least-privilege, per-window, explicitly reviewable grants; no shell/fs.
- `style-src 'unsafe-inline'` is retained because the UI uses React inline styles
  (e.g. progress-bar widths); tightening to nonces/hashes is deferred.
- The capability files and CSP config are validated at build (`cargo build`). The
  CSP must still be confirmed at runtime with `npm run tauri:dev` and a production
  build — a too-strict policy renders a blank window or blocks assets/HMR. That
  runtime confirmation is the remaining VIGIL-003 checkpoint.
