# Validation Record — v0.0.2

**Build date:** 2026-07-17

This record describes checks executed against the packaged repository. Re-run them after extraction on the target machine.

## Executed frontend checks

```bash
npm install
npm run assets:generate
npm run docs:tree
npm run version:check
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright test --list
CHROMIUM_PATH=/usr/bin/chromium npm run preview:capture
```

Results:

- dependency audit: `0` known npm vulnerabilities,
- synchronized version: `0.0.2`,
- TypeScript typecheck: passed,
- ESLint: passed,
- Vitest: `2` files, `5/5` tests passed,
- Vite production build: passed,
- Playwright E2E discovery: passed,
- deterministic 1600×900 preview capture: passed,
- generated asset manifest: passed,
- deterministic project-tree generation: passed.

The Playwright browser journey itself was not executed in this artifact environment because browser navigation is restricted by the container policy. The test is committed and CI installs Chromium before running it.

## Visual checks

- User-supplied reference is preserved as `reference-only`.
- Main UI is rebuilt as separate semantic widgets; the reference is not embedded as a flattened interactive background.
- Runtime text remains HTML.
- Frame and texture assets render through nearest-neighbour/9-slice-oriented CSS.
- Preview output: `docs/assets/ui-concept-v0.0.2.png` at 1600×900.
- Production UI and character assets remain explicitly blocked on user supply/approval IDs in `docs/assets/asset-registry.yaml`.

## Native checks not executable here

Rust is not installed in the artifact environment, so the following commands were not run locally:

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri:dev
npm run tauri:build
```

The GitHub Actions Windows job contains the Rust format, Clippy and test gates. A Windows machine with the prerequisites in `docs/development/setup-windows.md` must complete native validation before a desktop release is declared usable.
