# Git, Releases and Versioning

## Semantic versioning

The project follows SemVer syntax. Before `1.0.0`, the public product contract is still evolving, so the repository uses this interpretation:

- `0.0.PATCH` — foundation iterations, specifications, spikes and non-user release scaffolds.
- `0.MINOR.0` — coherent testable product milestone.
- `0.MINOR.PATCH` — compatible fixes within that milestone.
- `1.0.0` — first documented stable public product contract.
- Pre-release examples: `0.5.0-alpha.1`, `0.8.0-beta.2`, `0.9.0-rc.1`.

Never modify the contents of a released version; publish a new version.

## Synchronization

These must match:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

Run `npm run version:check`.

## Commits

Use Conventional Commit shape plus task ID:

```text
feat(ui): add componentized Roman focus dashboard [VIGIL-UI-001]
fix(timer): preserve paused duration during recovery [VIGIL-007]
docs(agent): enforce user asset dependency gate [VIGIL-ASSET-001]
```

## Branches

```text
feat/VIGIL-123-short-description
fix/VIGIL-123-short-description
release/0.2.0
hotfix/1.0.1
```

## Pull requests

A PR must link the task/spec, list asset dependencies, include validation output and call out changes to native permissions or visual baselines.
