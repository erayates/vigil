# Capability and Dependency Security Audit (VIGIL-038)

Audited at **v0.2.0 + progression** (Tauri 2.11.5, Rust and npm trees as locked).
Re-run the commands below before each release.

## 1. Capability review — least privilege

Both windows are granted exactly two permissions, and both are used:

| Capability         | Permission                         | Actually used by                                      |
| ------------------ | ---------------------------------- | ----------------------------------------------------- |
| `main-window`      | `core:event:default`               | `session://changed` and `companion://prefs` listeners |
| `main-window`      | `core:window:allow-start-dragging` | Title-bar drag region                                 |
| `companion-window` | `core:event:default`               | Session snapshot sync in the overlay                  |
| `companion-window` | `core:window:allow-start-dragging` | Overlay drag handle                                   |

**Pass.** Everything else — window show/hide, click-through, session mutations,
campaign/doctrine/companion/recovery preferences, export/import, tray, global
shortcut, notification and autostart — runs as Rust-side commands or backend
plugin calls, which do not cross the webview capability boundary and therefore
grant the frontend nothing. No shell, filesystem or broad `core:default`
permission is present.

## 2. Dependency audit

| Tree | Command       | Result                                                        |
| ---- | ------------- | ------------------------------------------------------------- |
| npm  | `npm audit`   | **0 vulnerabilities**                                         |
| Rust | `cargo audit` | **0 vulnerabilities** (486 crates vs 1166 advisories), exit 0 |

### Rust warnings (no vulnerability, informational)

17 advisory warnings: **16 unmaintained**, **1 unsound**. All are transitive
dependencies of the Tauri desktop stack, not direct dependencies:

- `glib 0.18.5` — unsound iterator impl (RUSTSEC-2024-0429). Reached through the
  GTK/Linux backend; the Windows target does not compile it.
- `unic-ucd-ident`, `unic-ucd-version` (RUSTSEC-2025-0100 / 0098) — unmaintained
  Unicode tables, no known vulnerability.
- The remaining unmaintained warnings come from the same GTK/webkit chain.

**Assessment:** accept for now. None is an exploitable advisory, none is a direct
dependency, and all resolve when the upstream Tauri stack updates. Re-check each
release; escalate if any becomes a vulnerability rather than a warning.

Direct dependencies are deliberately few: `rusqlite`, `rusqlite_migration`,
`serde`, `serde_json`, `tauri`, the three official Tauri plugins
(`autostart`, `global-shortcut`, `notification`) and `uuid`.

## 3. How to re-run

```bash
npm audit
cargo install cargo-audit --locked   # once
cd src-tauri && cargo audit
```

## 4. Findings

| #   | Finding                                               | Severity | Action                        |
| --- | ----------------------------------------------------- | -------- | ----------------------------- |
| 1   | 17 transitive advisory warnings in the Tauri/GTK tree | Info     | Accept; re-check each release |
| —   | No vulnerabilities, no over-granted capability        | —        | None                          |
