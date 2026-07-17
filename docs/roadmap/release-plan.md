# Release Plan and Semantic Versioning

## Current repository version

`v0.0.2 — Pixel UI Foundation`

## Pre-1.0 policy

- `0.0.PATCH`: foundation iterations, specifications, spikes and implementation scaffolds not presented as stable user releases.
- `0.MINOR.0`: coherent testable product milestone.
- `0.MINOR.PATCH`: compatible fixes within the milestone.
- Data-format changes always require migration notes even before 1.0.
- Released contents are immutable; changes require a new version.

## Planned versions

### `v0.0.1` — Initial foundation

Browser prototype, Tauri shell, timer model, first documentation and generated assets.

### `v0.0.2` — Pixel UI foundation

Current release. Componentized Roman campaign dashboard, custom window shell, asset registry/request gate, visual implementation specifications, coding standards and official research record.

### `v0.0.3` — Interaction and visual validation

- semantic control-state review,
- keyboard/focus pass,
- deterministic seeded demo state,
- screenshot/visual regression harness,
- responsive/DPI layout test presets,
- production-art request handoff package.

### `v0.0.4` — Architecture stabilization

- authoritative cross-window session ownership spike,
- SQLite migration/repository proof,
- capability separation review,
- CSP decision and native threat review,
- relevant ADRs.

### `v0.1.0` — Vertical slice alpha

Mission, accurate timer, companion sync, native local history, restart recovery, completion/abandon flows and approved-or-explicitly-deferred core art.

### `v0.1.1–v0.1.x`

Defects and usability fixes only. No campaign/progression expansion.

### `v0.2.0` — Daily-use alpha

Campaign basics, debrief, break doctrine, tray, global shortcut, notification, preferences and weekly summary.

### `v0.3.0` — Progression alpha

Disciplina, non-punitive continuity, rank, cosmetic equipment and camp visualization.

### `v0.4.0` — Hardening alpha

Multi-monitor, suspend/resume, crash recovery, performance budget and accessibility audit.

### `v0.5.0` — Private beta

Brand lock, signed distribution preparation, onboarding and controlled feedback.

### `v0.6.0` — Retention beta

Loop/onboarding improvements based on measured evidence.

### `v0.7.0` — Content beta

Approved additional companions/equipment and campaign content.

### `v0.8.0` — Public beta

Updater, release channel, export/import and public support process.

### `v0.9.0` — Release candidate

Feature freeze, migration rehearsal, security/performance review.

### `v1.0.0` — Stable Windows release

Documented local-first product compatibility, recovery and upgrade guarantees.

## Version synchronization

The version must match in:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- release heading in `CHANGELOG.md`

Run `npm run version:check` before release.
