# Architecture Boundary Standards

## Frontend slices

```text
app       composition, providers, global styles
pages     route/window-level screens
widgets   independent page sections
features  user actions and use cases
entities  domain data, pure calculations and display primitives
shared    generic UI, adapters, utilities and configuration
```

## Rules

- A feature owns one user intent, not an entire page.
- Entities contain no imports from features, widgets, pages or app.
- Shared code must be genuinely generic; do not move business code to `shared` to bypass dependency direction.
- Window-specific UI stays in a window widget/page, while session behavior remains shared.
- Native calls go through adapters under `shared/lib` or application ports, never directly from arbitrary components.
- Persistence repositories implement domain-facing interfaces.
- Timestamp math is pure and independently tested.

## Tauri boundary

The Rust core is responsible for:

- authoritative active-session state,
- database connection and migrations,
- idempotent session commands,
- window orchestration,
- permissions and OS integrations.

The webview is responsible for:

- rendering,
- user input,
- local transient presentation state,
- issuing typed commands,
- responding to domain events.

## Decision threshold

Create an ADR when a change affects:

- state ownership,
- persistence technology or schema strategy,
- native capabilities,
- process/window communication,
- public domain command shape,
- visual rendering architecture,
- asset approval policy.
