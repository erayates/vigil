# Dashboard screenshot baselines

Deterministic visual-regression baselines for the main dashboard (VIGIL-UI-002),
produced by `tests/e2e/dashboard-visual.spec.ts`.

## Scaffold, not production

Everything under `scaffold/` is captured with **scaffold-only** art
(`SCAFFOLD-UI-001` / `SCAFFOLD-COMP-001`). These guard layout and pixel-scaling —
they are **not** an art approval. When `PROD-UI-001` / `PROD-COMP-001` are
approved, capture approved baselines under a `production/` sibling and retire
`scaffold/`. See `docs/development/coding-standards/testing.md`.

## Platform

Baselines are generated on Windows (`-win32` suffix) and are single-platform:
font rendering differs across OSes, so regenerate per platform if CI moves off
Windows.

## Update procedure

```bash
npm run test:e2e -- dashboard-visual --update-snapshots   # rewrite baselines
npm run test:e2e -- dashboard-visual                      # verify (no update)
```

A changed baseline is a UI change — review every modified PNG before committing.
