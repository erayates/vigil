# Technical Research Source Register

**Research date:** 2026-07-17

Only primary/official documentation is used for engineering rules. Each entry records the concrete decision adopted by the repository.

| Topic                            | Official source                                                                          | Repository decision                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Tauri process and trust boundary | https://v2.tauri.app/concept/process-model/                                              | Core process owns privileged OS access and authoritative durable state; webviews are presentation processes. |
| Tauri architecture               | https://v2.tauri.app/concept/architecture/                                               | Keep a typed message-passing boundary between React and Rust.                                                |
| Tauri capabilities               | https://v2.tauri.app/security/capabilities/                                              | Permissions are attached per window/webview and reviewed under least privilege.                              |
| Per-window capabilities          | https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/              | Main and companion capabilities are separated before native integrations expand.                             |
| Tauri state management           | https://v2.tauri.app/develop/state-management/                                           | Rust-managed state is the planned authoritative cross-window owner.                                          |
| Rust/frontend commands           | https://v2.tauri.app/develop/calling-rust/                                               | Native actions pass through explicit commands with validation and error handling.                            |
| Frontend events                  | https://v2.tauri.app/develop/calling-frontend/                                           | Domain changes may be broadcast to windows; events do not replace authoritative state.                       |
| Window customization             | https://v2.tauri.app/learn/window-customization/                                         | A custom undecorated main window is supported; recovery and keyboard behavior remain requirements.           |
| React purity                     | https://react.dev/reference/rules/components-and-hooks-must-be-pure                      | Rendering is idempotent and side-effect free.                                                                |
| React effects                    | https://react.dev/learn/you-might-not-need-an-effect                                     | Effects are limited to external synchronization; derived state is calculated in render.                      |
| React state structure            | https://react.dev/learn/choosing-the-state-structure                                     | Avoid redundant/contradictory state and keep one source of truth.                                            |
| TypeScript strictness            | https://www.typescriptlang.org/tsconfig/strict.html                                      | `strict` remains enabled; boundary data is narrowed or parsed.                                               |
| ESLint configuration             | https://eslint.org/docs/latest/use/configure/configuration-files                         | Use the current flat-config model.                                                                           |
| Pixel scaling                    | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering    | Pixel assets use `image-rendering: pixelated` and integer-oriented scaling.                                  |
| 9-slice borders                  | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image       | Ornate frames are componentized with `border-image`, not flattened screen backgrounds.                       |
| Border slicing                   | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-image-slice | Corners/edges/centre regions are designed as scalable 9-slice assets.                                        |
| WCAG 2.2                         | https://www.w3.org/TR/WCAG22/                                                            | Keyboard access, no keyboard trap and perceivable interaction states are release criteria.                   |
| Focus visibility                 | https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html                           | Every interactive control has a visible keyboard focus indicator.                                            |
| Focus appearance                 | https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html                        | Ornate frames must not obscure the focus indicator.                                                          |
| Testing Library                  | https://testing-library.com/docs/queries/about/                                          | Component tests query by user-facing semantics before test IDs.                                              |
| Vitest                           | https://vitest.dev/guide/                                                                | Unit/component tests share the Vite transformation environment.                                              |
| Vitest visual testing            | https://vitest.dev/guide/browser/visual-regression-testing                               | Dynamic content is frozen/masked and thresholds remain explicit.                                             |
| Playwright screenshots           | https://playwright.dev/docs/test-snapshots                                               | Critical visual screens receive deterministic screenshot comparisons when enabled.                           |
| Playwright practices             | https://playwright.dev/docs/best-practices                                               | E2E tests focus on user-visible behavior and resilient locators.                                             |
| Rust formatting                  | https://doc.rust-lang.org/cargo/commands/cargo-fmt.html                                  | `cargo fmt --check` is required.                                                                             |
| Rust linting                     | https://doc.rust-lang.org/book/appendix-04-useful-development-tools.html                 | Clippy warnings are treated as errors for release code.                                                      |
| Semantic versioning              | https://semver.org/                                                                      | Version syntax and release immutability follow SemVer; pre-1.0 interpretation is documented.                 |

## Research conclusions

1. The safest cross-window design is a single authoritative core/session service, not independent Zustand stores in each webview.
2. The requested pixel-art density is best implemented as semantic HTML plus resizable raster frames, textures and sprite sheets.
3. A visual-heavy product needs visual regression tests, but screenshot baselines must be generated only after asset approval.
4. Accessibility cannot be delegated to the flat artwork; keyboard, text and focus behavior must remain native/semantic.
5. Agentic implementation needs an explicit stop condition for missing assets, because visual approximations can otherwise enter the codebase as accidental decisions.
