# Security Standards

## Trust model

Treat the webview as an untrusted presentation process. Sensitive business logic, durable state and privileged OS operations belong in the Tauri core.

## Required controls

- Least-privilege Tauri capabilities by window.
- No secrets in frontend source, localStorage or logs.
- Validate every IPC argument.
- Escape/render user content through React; do not use `dangerouslySetInnerHTML`.
- Do not load remote scripts, fonts or application UI assets.
- Add and test a restrictive Content Security Policy before `v0.1.0` release.
- Pin and review direct dependency versions.
- Record every new plugin/native capability in an ADR and threat review.
- No shell execution or arbitrary filesystem access in the MVP.

## Data privacy

- Local-first by default.
- No telemetry without explicit product decision and user consent.
- Exported data must be user-initiated and documented.
- Crash reporting is opt-in during beta.

## Release checks

- dependency audit,
- Tauri capability diff,
- CSP verification,
- installer signature plan,
- migration backup/recovery test,
- no development endpoints or debug flags.
