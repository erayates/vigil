# ADR-004 — Componentized Pixel UI Instead of a Flattened Background

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

The selected Roman focus reference resembles a complete game UI and could be implemented rapidly as one background image with positioned hotspots. That approach would make dynamic text, localization, resizing, accessibility and state-specific controls fragile.

## Decision

Implement the main interface with semantic React components and CSS Grid. Use raster art only for textures, ornaments, icons, sprite sheets and resizable 9-slice frames through `border-image`.

## Consequences

### Positive

- dynamic timer/task text remains reliable,
- keyboard and screen-reader semantics remain available,
- panels can resize without distorted corners,
- approved art can replace scaffold art without domain changes,
- individual visual regions can receive regression tests.

### Negative

- more individual assets and component states are required,
- exact visual polish takes longer than using one image,
- production art needs a structured handoff.
