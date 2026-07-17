# Agent Operating Contract

This file is authoritative for every AI coding agent working in this repository.
When another instruction conflicts with this file, stop and ask the user which instruction wins.

## Required reading order

1. `docs/START-HERE.md`
2. `USER-INPUT-GATE.md`
3. `docs/product/mvp-prd.md`
4. `docs/agent/asset-request-protocol.md`
5. `docs/development/coding-standards/README.md`
6. `docs/domain/focus-session-state-machine.md`
7. `docs/architecture/system-architecture.md`
8. the relevant phase file under `docs/roadmap/phases/`
9. the task's linked specification and acceptance criteria

## Required agent tooling

These plugins are mandatory in this repository and are declared in `.claude/settings.json`. Every agent uses them continuously, not only when explicitly asked.

- **superpowers** — process skills. Invoke the matching skill *before* the activity, then follow it exactly: `brainstorming` before any feature or plan work, `writing-plans` before a multi-step task, `test-driven-development` before writing implementation code, `systematic-debugging` before any bug fix, `verification-before-completion` before claiming work is done. Do not skip a skill's workflow.
- **ponytail** — anti-over-engineering discipline, active on every response. Climb the ladder before writing code (does it need to exist → reuse what already lives here → standard library → native platform feature → already-installed dependency → one line → minimum code that works). Prefer deletion and the shortest working diff. Mark deliberate simplifications with a `ponytail:` comment.
- **codegraph** — local, pre-indexed code knowledge graph (MCP server plus a `.codegraph/` index). Before running grep/find or reading files broadly to locate or understand code, query it first: the `codegraph_explore` MCP tool, or `codegraph explore "<symbols or question>"` in the shell, returns the relevant symbols' source plus the call paths between them in a single call. The index auto-syncs; rebuild manually with `codegraph sync` after large changes. If the `.codegraph/` directory is absent, skip codegraph (re-index with `codegraph init`).

When a plugin's default workflow conflicts with a user instruction, the user instruction wins (see the conflict rule at the top of this file).

## Mandatory user-supplied artifact gate

**This rule is non-negotiable.**

Before changing code, read `USER-INPUT-GATE.md`, inspect `docs/assets/asset-registry.yaml` and identify every visual, audio, copy, font, data, configuration, source-file or reference dependency required by the task.

Stop and ask the user before continuing when any required dependency is:

- missing,
- ambiguous,
- marked `request-user`, `blocked-user` or `reference-only`,
- present only as a low-resolution preview,
- not licensed or provenance is unknown,
- expected to match a supplied product/character/logo exactly,
- required in dimensions, states or formats not yet supplied.

When the gate is triggered, the agent must:

1. make **no implementation changes for that task**,
2. not generate a substitute,
3. not download a stock asset,
4. not invent a logo, icon, sprite, illustration, audio file, font or product image,
5. not silently continue using a placeholder,
6. send one precise request using the template in `docs/agent/asset-request-protocol.md`,
7. wait for the user to supply or explicitly waive the dependency.

The generated files under `public/assets/` are `scaffold-only`. They may be used only when the task explicitly allows scaffold assets. They are not production art approval.

## Core product invariants

- Preserve the **one active mission / one active focus session** invariant.
- Timer correctness is based on timestamps, never decrement-only counters.
- The Tauri core/domain layer becomes the authoritative state owner before `v0.1.0`.
- UI state must not become the source of truth for domain state.
- No cloud account, analytics SDK, AI API, social layer or blocker feature before its roadmap gate.
- Keep Roman terminology thematic; primary actions remain understandable.
- Never punish or shame a user for interruption, abandonment or a missed day.
- All runtime text remains real HTML; do not bake functional text into raster images.
- Pixel art uses nearest-neighbour rendering and integer-scale targets.
- Do not add remote fonts or bundle font files.
- New native capabilities require a security review, least-privilege capability mapping and an ADR.
- Every behavior change requires tests or a documented test-debt issue.
- Do not edit generated scaffold assets directly; update `scripts/generate_pixel_assets.py` and regenerate.

## Coding requirements

- Follow `docs/development/coding-standards/README.md` and its linked standards.
- TypeScript must remain strict; boundary data is parsed, not asserted.
- Source file names are kebab-case (`main-shell.tsx`, `use-focus-store.ts`); component identifiers stay PascalCase. See `docs/development/coding-standards/typescript-react.md`.
- React render logic stays pure; Effects only synchronize with external systems.
- Rust code passes `cargo fmt --check` and `cargo clippy -- -D warnings` before release.
- Prefer semantic queries in UI tests; use test IDs only when no user-facing query is viable.
- Visual changes require a deterministic screenshot baseline once visual regression tooling is enabled.
- Accessibility and keyboard behavior are acceptance criteria, not polish tasks.

## Agent task format

Every implementation request should include:

```yaml
id: VIGIL-XXX
version_target: 0.x.0
phase: Pn
objective: One observable outcome
in_scope:
  - Explicit behavior
out_of_scope:
  - Explicit exclusions
asset_dependencies:
  - ID from docs/assets/asset-registry.yaml or NONE
specs:
  - docs/path.md
acceptance_criteria:
  - Given/When/Then result
validation:
  - npm run check
```

## Required preflight response

Before implementation, the agent should state internally or in its task log:

```text
Specs read:
Asset registry checked:
Missing/ambiguous dependencies:
Architecture boundary affected:
Planned tests:
```

If `Missing/ambiguous dependencies` is not `NONE`, trigger the user-input gate and stop before making partial implementation changes.

## Completion response expected from an agent

An agent must return:

1. changed files,
2. decisions made,
3. validation commands and results,
4. unresolved risks or assumptions,
5. asset registry changes,
6. suggested next task only when it directly follows the roadmap.

## Branch and commit convention

- Branch: `feat/VIGIL-123-short-description`
- Commit: `feat(session): recover active focus after restart [VIGIL-123]`
- Release branches: `release/0.2.0`
- Hotfix branches after v1: `hotfix/1.0.1`

## Definition of done

A task is not done until:

- acceptance criteria pass,
- typecheck, lint, tests and required native checks pass,
- relevant specifications remain accurate,
- visual dependencies are approved or explicitly waived,
- accessibility impacts are verified,
- edge cases are documented,
- no unapproved scope is introduced.
