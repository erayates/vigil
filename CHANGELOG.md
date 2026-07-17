# Changelog

All notable changes follow Keep a Changelog structure. The project uses Semantic Versioning with the pre-1.0 policy defined in `docs/roadmap/release-plan.md`.

## [Unreleased]

### Planned for 0.0.3

- Deterministic visual-regression harness.
- Keyboard/focus and control-state review.
- Viewport/DPI layout presets.
- Production UI and character asset request handoff.

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
