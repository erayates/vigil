# VIGIL — Roman Focus Companion

**Repository version:** `v0.0.2 — Pixel UI Foundation`

VIGIL is a local-first desktop focus companion. A Roman-inspired pixel legionary reflects the current session state, while the main application presents work as a campaign through a dense game-interface dashboard.

## What changed in v0.0.2

- Rebuilt the main screen around the supplied Roman pixel-interface direction.
- Added a componentized 16:9 campaign dashboard instead of a flattened background image.
- Added custom Tauri titlebar controls.
- Added generated scaffold 9-slice frames, textures and 64×96 companion states.
- Added an asset registry and a mandatory rule requiring coding agents to ask the user for missing visual/file dependencies and stop before proceeding.
- Added TypeScript/React, architecture, CSS/pixel UI, Tauri/Rust, testing, security and Git/versioning standards.
- Added an official technical research source register and new architecture decisions.

## Start here

1. Read [`docs/START-HERE.md`](docs/START-HERE.md).
2. Read [`AGENTS.md`](AGENTS.md) before assigning work to an agent.
3. Read [`USER-INPUT-GATE.md`](USER-INPUT-GATE.md).
4. Read [`docs/agent/asset-request-protocol.md`](docs/agent/asset-request-protocol.md).
5. Inspect [`docs/assets/asset-registry.yaml`](docs/assets/asset-registry.yaml).
6. Install dependencies: `npm install`.
7. Generate scaffold assets: `npm run assets:generate`.
8. Run the browser prototype: `npm run dev`.
9. Follow [`docs/development/setup-windows.md`](docs/development/setup-windows.md) for Tauri.

## Mandatory asset rule

When a task requires an image, sprite, UI element, logo, icon, font, audio, data/configuration file, exact source file or other user-owned dependency that is missing or ambiguous, the agent must ask the user and stop the current task before making partial implementation changes. It may not silently generate, download or substitute the asset.

Current generated files are **scaffold-only**, not approved production art.

## Current implementation

- mission and victory-condition editing,
- 15/25/50/90/custom focus modes,
- prepare, focus, pause, complete and reset states,
- timestamp-derived remaining time,
- local prototype history,
- Roman pixel main dashboard,
- separate transparent companion route/window,
- custom main-window controls through Tauri commands,
- deterministic generated UI textures, 9-slice frames and sprite sheets.

SQLite, authoritative cross-window state, tray, shortcut, notifications, autostart, CSP hardening and production-art lock remain scheduled work.

## Core product sentence

> Choose one mission. Define victory. Hold formation. Record the result.

## Version path

| Version         | Product milestone                                    |
| --------------- | ---------------------------------------------------- |
| `v0.0.2`        | Pixel UI, agent asset gate and coding standards      |
| `v0.0.3`        | Interaction/accessibility and visual-test foundation |
| `v0.0.4`        | Cross-window state, SQLite and security spikes       |
| `v0.1.0`        | Reliable local vertical slice                        |
| `v0.2.0`        | Daily-use alpha                                      |
| `v0.3.0`        | Healthy progression alpha                            |
| `v0.4.0`        | Hardening alpha                                      |
| `v0.5.0–v0.8.0` | Private/public beta                                  |
| `v0.9.0`        | Release candidate                                    |
| `v1.0.0`        | Stable Windows release                               |

Full roadmap: [`docs/roadmap/ROADMAP.md`](docs/roadmap/ROADMAP.md).

## Visual references

- Supplied direction: [`docs/assets/legio-focus-ui-reference.png`](docs/assets/legio-focus-ui-reference.png)
- Scaffold sprite board: [`docs/assets/sprite-sheet-preview.png`](docs/assets/sprite-sheet-preview.png)
- Current implementation preview: [`docs/assets/ui-concept-v0.0.2.png`](docs/assets/ui-concept-v0.0.2.png)
- Scaffold asset board: [`docs/assets/ui-asset-board.png`](docs/assets/ui-asset-board.png)

The supplied reference is `reference-only` and is not embedded as the application background.
