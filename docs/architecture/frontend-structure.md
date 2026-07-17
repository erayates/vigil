# Frontend Structure

```text
src/
  app/          # bootstrapping, providers, global styles
  pages/        # route/window-level composition when routing expands
  widgets/      # independent dashboard/companion regions
  features/     # user actions and use cases
  entities/     # domain-facing types, pure calculations and entity UI
  shared/       # generic UI, utilities and typed native adapters
```

## Current dashboard widgets

```text
widgets/main-shell/
widgets/campaign-board/
widgets/focus-chamber/
widgets/companion-stage/
widgets/campaign-summary/
widgets/pixel-companion/
widgets/companion-overlay/
```

## Dependency direction

`app → pages → widgets → features → entities → shared`

A lower layer must not import from a higher layer. Domain-pure utilities avoid React and Tauri dependencies.

## State rules

- Form draft may temporarily live in React/Zustand.
- Durable and cross-window session state moves to the application/native layer.
- Countdown display is derived from authoritative timestamps.
- Do not store progress percentages, labels or other derived presentation values.

## Visual rules

- Widgets own layout composition, not production asset provenance.
- Asset paths must map to registry entries.
- Missing assets trigger the user request gate.
- Functional text and controls remain semantic HTML.
- Shared pixel UI primitives may be introduced only when at least two widgets require the same behavior, not merely the same colour.
