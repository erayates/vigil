# Testing Standards

## Test layers

### Pure domain tests

Cover timestamp math, valid/invalid state transitions, idempotency, progression calculations and migration rules. These are fast and exhaustive.

### Component/integration tests

Use Testing Library and query controls by role, accessible name, label or visible text. Test what the user can perceive and do. Use `data-testid` only when no semantic query can represent the behavior.

### Native integration tests

Cover repositories, migrations, command validation and state recovery in Rust where possible.

### End-to-end tests

Cover the critical path:

```text
mission → start → pause/resume → completion → persistence → restart recovery
```

### Visual regression

A pixel-art UI requires deterministic screenshots at agreed viewport/DPI presets. Disable animation, freeze time, seed data and compare stable regions. Do not approve broad thresholds that hide frame or alignment regressions.

Dashboard baselines live under `tests/e2e/__screenshots__/scaffold/` (see the README there for the update procedure). They are captured with scaffold art at the 1600×900 and 1280×800 presets on a single platform, and are regenerated under a `production/` sibling once `PROD-UI-001` / `PROD-COMP-001` are approved.

## Naming

```text
<unit>.test.ts
<Component>.test.tsx
<journey>.spec.ts
```

Test names use behavior language:

```text
rejects a second start command while a session is active
restores remaining time from timestamps after process restart
shows a visible keyboard focus ring on the Start control
```

## Required coverage by change

- Domain behavior change: unit tests.
- UI behavior change: component test.
- Native/persistence change: Rust integration test.
- Main flow change: E2E update.
- Visual layout/asset change: screenshot baseline update after asset approval.

## Determinism

- Inject clocks into domain logic.
- Avoid real-time sleeps in unit tests.
- Reset mocks between tests.
- Use stable locale/timezone in CI.
- Mask or freeze dynamic time values in screenshots.

## Commands

```bash
npm run test          # Vitest unit/component suite
npm run test:e2e      # Playwright user journey
npm run preview:capture
```

Install the Playwright Chromium runtime once per machine with `npm run test:e2e:install`.

`preview:capture` is a documentation preview, not an automatically approved production screenshot baseline. Production baselines remain blocked until the relevant asset registry entries are approved.
