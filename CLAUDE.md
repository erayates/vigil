# Claude Repository Instructions

Read and obey `AGENTS.md` before planning or editing.

The highest-risk rule is the **mandatory user-supplied artifact gate** in `USER-INPUT-GATE.md`:

- inspect `docs/assets/asset-registry.yaml` before any task,
- when a required image, sprite, UI element, icon, logo, font, audio, data/configuration file, copy block, reference or exact source file is missing or ambiguous, stop,
- ask the user using `docs/agent/asset-request-protocol.md`,
- do not generate, download, infer or substitute the missing dependency,
- do not continue the task until the user supplies it or explicitly authorizes a placeholder.

Then follow the relevant product, domain, architecture, roadmap and coding-standard documents.
