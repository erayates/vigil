# Agent Task Template

```yaml
id: VIGIL-000
version_target: 0.0.0
phase: P0
objective: Describe one user-visible outcome.
in_scope:
  - Item
out_of_scope:
  - Item
asset_dependencies:
  - NONE
specs:
  - docs/path.md
acceptance_criteria:
  - Given ... when ... then ...
validation:
  - npm run typecheck
  - npm run lint
  - npm run test
  - npm run build
```

## Preflight checklist

- [ ] Read `AGENTS.md`.
- [ ] Read linked specs.
- [ ] Checked asset registry.
- [ ] No missing or ambiguous dependencies.
- [ ] Architecture boundary identified.
- [ ] Tests planned.
- [ ] Accessibility impact identified.
