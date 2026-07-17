# ADR-005 — User Asset Dependency Gate

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

Agentic coding tools may invent placeholders or download substitutes when an implementation requires an image, sprite, icon, font, audio file or exact source asset. In a visual product this can turn an unapproved approximation into an accidental product decision.

## Decision

All visual/file dependencies are tracked in `docs/assets/asset-registry.yaml`. When a required dependency is missing, ambiguous or not approved, the agent stops the current task and requests it from the user using `docs/agent/asset-request-protocol.md`.

The agent may not continue with an invented/generated/downloaded substitute unless the user explicitly authorizes scaffold placeholder use for that named task.

## Consequences

- visual fidelity and ownership remain user-controlled,
- blocked tasks become explicit,
- agent autonomy is deliberately reduced at asset boundaries,
- task prompts must list asset dependencies.
