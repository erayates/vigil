# Changelog

All notable changes follow Keep a Changelog structure. The project uses Semantic Versioning with the pre-1.0 policy defined in `docs/roadmap/release-plan.md`.

## [0.4.0] - 2026-07-20 — Hardening

Everything in this release is about what happens when things go wrong, or when
nobody is looking.

### Added

- Suspend detection — a machine that slept mid-watch asks whether the away time
  counted as focus, and never decides for you.
- Crash and corruption recovery — an unreadable data file is preserved beside a
  fresh one and reported, never silently recreated; an untrustworthy active
  session is kept as a recovery record instead of restored as a broken timer.
- Automated migration tests — every schema step is verified against rows
  written before it, so an upgrade cannot drop records.
- Accessibility pass — motion is optional, every control has an accessible
  name (enforced by test), and phase changes announce once rather than every
  second.
- Documented budgets and behaviour: idle resources, multi-monitor placement,
  installer and uninstaller data handling, and a dependency security audit.

### Fixed

- Idle CPU dropped from 10.4% of a core to 0.1%. WebView2 never throttles a
  minimised or hidden window, so decorative animation was painting all day for
  nobody — including in the hidden companion window.
- Flipping the companion side no longer drags it to the primary monitor; it
  stays on the display it is already on.
- A companion whose drag handle sits off-screen is now rescued. Previously any
  one-pixel overlap counted as reachable.
- A NULL victory condition in a hand-edited or imported row could make startup
  fail outright. It is tolerated now.

## [0.3.0] - 2026-07-19 — Progression

### Added

- Disciplina — a single earned score from completed watches and focused time,
  with a documented, auditable calculation.
- Rank ladder from Tiro to Primus Pilus, derived from Disciplina.
- Formation Integrity — a seven-day continuity ratio with no shame mechanics:
  a missed day lowers a number, it does not break anything.
- Recovery Days — planned rest is marked as such and leaves continuity neutral.
- Progress explanation surface, so every number can be traced to the watches
  that produced it.

### Deferred

- Camp growth visualization (VIGIL-029) and cosmetic equipment unlocks
  (VIGIL-030) are blocked on user-supplied art (`PROD-CAMP-001`,
  `PROD-COMP-002`) and move to a later release.

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
