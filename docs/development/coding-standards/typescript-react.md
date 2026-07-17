# TypeScript and React Standards

## TypeScript

- Keep `strict: true` and do not disable strict flags per file.
- Avoid `any`. Use `unknown` at untrusted boundaries and narrow it.
- Parse persistence, IPC and imported data with schemas before domain use.
- Prefer discriminated unions for state machines and command results.
- Avoid non-null assertions (`!`). Prove the value or return a typed error.
- Prefer immutable updates. Do not mutate objects owned by another layer.
- Public functions and exported components should have explicit intent-revealing types.
- Use `satisfies` where it verifies shape without widening useful literals.
- Do not duplicate domain enums as strings in multiple files.
- Time values include units in names: `startedAtMs`, `durationSeconds`.

## React purity

- Components and hooks must be idempotent for the same props, state and context.
- Rendering must not write storage, invoke native commands, modify global variables or start timers.
- Effects are only for synchronization with an external system: native window APIs, timers, subscriptions or storage adapters.
- Do not use an Effect to calculate values that can be derived during render.
- Event handlers perform user-triggered mutations.
- Keep one authoritative state value; derive labels, progress and disabled states.
- Do not mirror props into local state without a documented reason.

## Components

- Prefer semantic HTML before generic `div` elements.
- Every interactive control uses a real `button`, `input`, `select` or link.
- Component identifiers are PascalCase; hooks begin with `use`; events use `handle<Action>`.
- Source file names are kebab-case: `main-shell.tsx`, `use-focus-store.ts`, `native-bridge.ts`, `main-shell.test.tsx`. The file name is kebab-case even though its exported identifier stays PascalCase (`main-shell.tsx` → `export function MainShell`). This applies to every `.ts`/`.tsx` file, including hooks, utilities and tests; directory names are already kebab-case.
- Keep domain decisions out of view components.
- A component may compose features and entities but must not reach into another feature's internal module.
- Avoid giant components. Extract when a section has its own behavior, tests or accessibility contract.
- Do not create barrel exports that hide forbidden cross-layer dependencies.

## State

- Domain state: Rust/application service by `v0.1.0`.
- Temporary presentation state: local React state.
- Shared prototype state: Zustand only until the authoritative cross-window owner is implemented.
- Persisted browser state is explicitly prototype-only.
- Do not store derived values such as progress percentage when they can be calculated.

## Errors

- User errors are neutral and actionable.
- Domain errors are typed and testable.
- Native adapter failures return or log enough context without exposing secrets.
- Never ignore a rejected Promise intentionally without `void` and an adapter-level error policy.

## Imports

Use the `@/` alias for application imports. Preferred dependency direction:

```text
app/pages → widgets → features → entities → shared
```

A lower layer never imports a higher layer.
