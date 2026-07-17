# Agentic Execution Workflow

## 1. Intake

Resolve the task ID, target version, phase, acceptance criteria and explicit exclusions. Do not infer a feature merely because it appears in a concept image.

## 2. Specification pass

Read the product, UX, domain and architecture documents linked by the task. Record contradictions as blockers rather than choosing silently.

## 3. Dependency and asset preflight

Inspect package boundaries, native capabilities and `docs/assets/asset-registry.yaml`. Apply the mandatory asset request protocol before code changes.

## 4. Plan a vertical change

Prefer one end-to-end observable outcome over multiple disconnected utilities. Identify domain logic, interface adapters, UI, persistence and tests separately.

## 5. Implement within boundaries

- Domain logic remains independent from React.
- React components orchestrate presentation and user events.
- Native/OS access passes through typed adapters.
- Generated scaffold assets remain visibly documented as placeholders.

## 6. Validate incrementally

Run the narrowest relevant test first, then the full checks. A visual change also needs keyboard review, reduced-motion review and deterministic screenshot comparison when available.

## 7. Documentation reconciliation

Update specs and ADRs in the same change. Code must not become the only record of a decision.

## 8. Handoff

Report changed files, validation results, assumptions, unresolved risks and the next roadmap task. Do not claim completion when a required user asset remains unresolved.
