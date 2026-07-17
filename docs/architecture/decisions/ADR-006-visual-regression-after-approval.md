# ADR-006 — Visual Regression Baselines Follow Asset Approval

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

Pixel-art interfaces are sensitive to one-pixel shifts, scaling and frame changes. Screenshot comparison is useful, but baselining temporary assets can make placeholders appear permanent.

## Decision

Introduce deterministic screenshot tests in v0.0.3. Scaffold baselines may validate layout mechanics, but production visual baselines are created or renewed only after the relevant asset registry entries are `approved`.

Freeze clocks, seed data, disable animation and use explicit viewport/DPI presets.

## Consequences

- layout regressions are detected early,
- production art approval remains a separate gate,
- baseline changes require review rather than automatic acceptance.
