# Mandatory User Input Gate

This repository contains a hard stop rule for any implementation task that depends on a user-supplied artifact or decision.

## Stop immediately when the task needs

- an image, illustration, product photo, screenshot or visual reference,
- a sprite sheet, animation state, UI element, icon, logo or ornament,
- a font, audio file, video or copy deck,
- an exact source/design file such as Aseprite, Figma, SVG, PSD or layered PNG,
- a data file, schema, configuration, credential or document that has not been supplied,
- clarification about dimensions, states, crop, wording, ownership, licence or exact fidelity.

## Required behavior

The agent must:

1. inspect `docs/assets/asset-registry.yaml`,
2. consolidate all missing inputs into one precise request,
3. ask the user using `docs/agent/asset-request-protocol.md`,
4. make no implementation changes for the blocked task,
5. wait until the user supplies the input or explicitly waives that exact dependency.

The agent must not generate, download, infer, redraw, crop, substitute or silently keep using a placeholder. A generic instruction such as “use placeholders where necessary” is not sufficient; the waiver must name the task or asset dependency.

## Resume condition

Work resumes only when one of these is recorded:

- the required artifact is supplied and registered,
- the user resolves the missing decision,
- the user explicitly permits a named scaffold/placeholder for the named task.

This gate overrides schedule pressure and convenience. A blocked task remains blocked rather than being completed with an unapproved approximation.
