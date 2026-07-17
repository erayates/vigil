# Start Here

## Repository purpose

This repository is the zero-to-v1 execution base for VIGIL, a Roman-inspired pixel-art desktop focus companion. It combines a runnable Tauri/React scaffold, product specifications, an asset approval system, engineering standards and a phased roadmap suitable for agentic implementation.

## Current release

`v0.0.2 — Pixel UI Foundation`

This release changes the primary main-window direction to a dense 16:9 Roman game-interface dashboard based on the user-supplied reference `REF-UI-001`. The implementation remains componentized and uses live HTML controls rather than one flattened image.

## Source-of-truth hierarchy

When documents conflict, use this order:

1. `AGENTS.md`
2. `USER-INPUT-GATE.md`, especially the artifact dependency gate,
3. release contract for the target version,
4. MVP PRD and product principles,
5. domain invariants and state machine,
6. architecture decisions,
7. coding standards,
8. phase backlog,
9. current implementation.

The code is not automatically the specification. Resolve contradictions explicitly.

## Mandatory first steps for any agent

1. Read `AGENTS.md`.
2. Read `USER-INPUT-GATE.md`.
3. Read `docs/agent/asset-request-protocol.md`.
4. Inspect `docs/assets/asset-registry.yaml`.
5. Read `docs/development/coding-standards/README.md`.
6. Read the target phase and linked specifications.
7. Stop and ask the user before changing code when any required user-supplied artifact or decision is missing or ambiguous.

## Run the scaffold

```bash
npm install
npm run assets:generate
npm run dev
```

Desktop prerequisites and commands are in `docs/development/setup-windows.md`.

## Immediate delivery sequence

1. Complete the remaining `v0.0.2` validation and visual review.
2. Implement `v0.0.3` interaction and deterministic visual-test foundation.
3. Resolve the user-supplied production art requests before art lock.
4. Stabilize authoritative cross-window state and SQLite spikes in `v0.0.4`.
5. Deliver the `v0.1.0` vertical slice.

## v0.1.0 proof flow

> Create mission → define victory → start session → companion reflects state → pause/resume → complete → store local record → recover safely after restart.

## Documents by discipline

- Agent workflow: `docs/agent/`
- Product: `docs/product/`
- UX and visual behavior: `docs/ux/`
- Asset registry/requests: `docs/assets/`
- Domain: `docs/domain/`
- Architecture and ADRs: `docs/architecture/`
- Roadmap: `docs/roadmap/`
- Quality: `docs/quality/`
- Coding standards: `docs/development/coding-standards/`
- Research sources: `docs/research/`
