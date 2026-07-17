# Windows Development Setup

## Required

- Node.js 22 LTS or compatible newer version.
- npm 10+.
- Rust stable toolchain with `rustfmt` and `clippy`.
- Microsoft C++ Build Tools with **Desktop development with C++**.
- Microsoft Edge WebView2 runtime.

## Initial commands

```powershell
npm install
npm run assets:generate
npm run version:check
npm run dev
npm run tauri:dev
```

## Full validation

```powershell
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --all-features
```

## First visual/native validation

1. Main window opens at the Roman 16:9 campaign dashboard.
2. Custom minimize, maximize/restore and close controls work.
3. Mission title, victory condition and duration can be edited in Idle.
4. Start shows the transparent companion window.
5. Pause/resume state is consistent within the prototype limitations.
6. Pixel assets remain crisp at 100%, 125%, 150% and 200% Windows scale.
7. Keyboard focus remains visible on ornate controls.
8. Reduced-motion preference suppresses nonessential looping transitions.

## Current known limitations

- Browser-local Zustand persistence is not a reliable shared source across two Tauri webviews. Complete `VIGIL-001` before treating native session state as domain-correct.
- CSP remains unset in the scaffold and is a `v0.0.4` release gate.
- Generated UI/character art is `scaffold-only`; production art requires user supply/approval through the asset registry.
