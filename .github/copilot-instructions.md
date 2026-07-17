# GitHub Copilot Instructions

`AGENTS.md` and `USER-INPUT-GATE.md` are authoritative.

Before proposing or generating code:

1. read the linked specification,
2. inspect `docs/assets/asset-registry.yaml`,
3. apply the user-supplied artifact gate,
4. preserve domain and feature-slice dependency direction,
5. follow `docs/development/coding-standards/README.md`.

Never invent, generate, download or substitute a missing visual/file/data dependency. Ask the user and stop the current task.
Do not embed functional text in images. Keep TypeScript strict, React render logic pure and native permissions minimal.
