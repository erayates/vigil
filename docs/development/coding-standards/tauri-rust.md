# Tauri and Rust Standards

## State ownership

By `v0.1.0`, the Tauri core owns the active focus session and durable repositories. Multiple webviews must never run independent authoritative timers.

## Commands

- Commands are small application-boundary functions.
- Group commands by domain/module when the list grows.
- Command names are unique and action-oriented.
- Validate and normalize all frontend arguments.
- Return serializable typed results and typed error codes/messages.
- Commands that may block use async execution or a dedicated worker strategy.
- Completion, recovery and migration operations are idempotent.

## Error handling

- Do not use `unwrap()` or `expect()` in runtime command paths.
- Map infrastructure failures to contextual errors.
- Startup may use a single terminal `expect` only when continuing is impossible and the message identifies the subsystem.
- Log internal detail separately from user-facing neutral messages.

## Capabilities

- Apply least privilege per window/webview.
- Main and companion windows should not automatically receive identical permissions.
- Never enable shell, broad filesystem or network access without a specific use case, scope and ADR.
- Review capabilities in every release checklist.

## Formatting and linting

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Data

- SQLite migrations are append-only after release.
- Store timestamps in UTC and preserve explicit units.
- Enforce at most one active session at the database/domain level.
- Back up before destructive migrations.
- Never store secrets in the webview or browser persistence.
