# Contributing

This repository follows a spec-driven and asset-gated workflow.

1. Select an item from `docs/backlog/backlog.yaml`.
2. Confirm target version, phase and asset dependencies.
3. Read `AGENTS.md` and the linked specifications.
4. Inspect `docs/assets/asset-registry.yaml`.
5. If a required asset is missing or ambiguous, ask the user and stop the task.
6. Create a narrow branch.
7. Update tests, specifications and registry entries with the implementation.
8. Run frontend and native validation.
9. Submit a pull request using the template.

Scope from a later phase should be proposed separately rather than bundled into an earlier release. Scaffold assets may not be promoted to production art without approval.
