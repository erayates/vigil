# Coding Standards Index

These standards are mandatory for code intended to enter the main branch.

## Required standards

1. [`typescript-react.md`](typescript-react.md)
2. [`architecture-boundaries.md`](architecture-boundaries.md)
3. [`css-pixel-ui.md`](css-pixel-ui.md)
4. [`tauri-rust.md`](tauri-rust.md)
5. [`testing.md`](testing.md)
6. [`security.md`](security.md)
7. [`assets-and-generated-files.md`](assets-and-generated-files.md)
8. [`git-versioning.md`](git-versioning.md)

## Baseline validation

```bash
npm run version:check
npm run typecheck
npm run lint
npm run test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

Rust commands require the Windows/Tauri toolchain described in `../setup-windows.md`.

## Review order

Review correctness in this order:

1. domain invariant and data integrity,
2. native permission/security impact,
3. user-observable behavior,
4. keyboard/accessibility behavior,
5. visual fidelity and pixel scaling,
6. maintainability and naming,
7. micro-optimisation.

## Exception policy

An exception requires:

- a linked issue,
- a specific reason,
- an expiry version,
- a test or compensating control,
- reviewer approval.

“An agent generated it” is not a valid exception.
