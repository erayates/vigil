# Changelog

All notable changes follow Keep a Changelog structure. The project uses Semantic Versioning with the pre-1.0 policy defined in `docs/roadmap/release-plan.md`.

## [0.2.0] - 2026-07-18 — Daily-use alpha (feature-complete)

Feature-complete; release gated on the seven-day dogfood (VIGIL-023) and the five-user test (VIGIL-012).

### Added

- Debrief flow — capture result, blocker and next action after a watch.
- Campaign entity with mission attribution and an active-campaign selector.
- Break state and Doctrine (short/long break lengths).
- Weekly local focus summary.
- System tray — show/hide companion, open, close-to-tray, quit.
- Global recovery shortcut (Ctrl+Shift+V).
- Native completion notification.
- Autostart (launch at login) preference.
- Companion window preferences (side, scale, opacity).
- Local data export and import.

## [0.1.0] - 2026-07-18 — Vertical slice alpha

### Added

- Authoritative cross-window session state machine in the Rust core.
- Mission, timestamp-derived timer and companion synchronization.
- SQLite persistence, restart recovery, and completion/abandon flows.
- Deterministic dashboard visual-regression and critical-path e2e tests.

## [0.0.4] - 2026-07-18 — Architecture stabilization

### Added

- Cross-window session ownership, SQLite migration/repository spike, per-window capability separation, CSP decision and the supporting ADRs.

## [0.0.3] - 2026-07-18 — Interaction and visual validation

### Added

- Keyboard/control-state pass and the deterministic visual-regression harness.

## [0.0.2] - 2026-07-17

### Added

- Componentized Roman pixel-art 16:9 dashboard.
- Campaign board, focus chamber, companion stage and campaign summary widgets.
- Custom Tauri main-window minimize, maximize/restore and close commands.
- Generated scaffold 9-slice frames and Roman material texture tiles.
- Updated 64×96 four-frame legionary state sheets.
- User-supplied UI reference breakdown and implementation plan.
- Mandatory user-supplied artifact gate with a no-partial-implementation stop rule.
- Asset registry, status model and request templates.
- TypeScript/React, architecture, CSS/pixel UI, Tauri/Rust, testing, security and Git/versioning standards.
- Technical research source register based on official documentation.
- ADRs for componentized pixel UI, asset gating and visual-regression approval.
- Testing Library component coverage, Playwright E2E scaffold and deterministic UI preview capture.
- Deterministic raster asset checksum/dimension manifest generation.
- Reproducible documented project-tree generator.

### Changed

- Default prototype focus mode from 50 to 25 minutes to match the main visual baseline.
- Main Tauri window to an undecorated 1600×900 visual baseline.
- Roadmap split the foundation into v0.0.2, v0.0.3 and v0.0.4 gates.
- Backlog now records status and asset dependencies.

### Security

- Documented least-privilege, IPC validation and CSP requirements before v0.1.0.

## [0.0.1] - 2026-07-17

### Added

- Initial Tauri + React + TypeScript repository scaffold.
- Browser-runnable focus prototype.
- Main and transparent companion window configuration.
- Timestamp-based timer utilities and unit tests.
- First generated pixel-art legionary states.
- Product, UX, domain, architecture, QA and roadmap documentation.
- Agent operating contract and v0.1 backlog.
