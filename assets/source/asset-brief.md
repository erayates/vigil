# Production Companion Art Brief — `PROD-COMP-001`

## Dependency state

`request-user`. A coding agent must ask the user and stop the art-integration task until source files are supplied or explicitly deferred.

## Character

A Roman-inspired legionary rendered in a disciplined, readable pixel-art style. The silhouette must remain identifiable without relying on facial detail. The character is a focus companion, not an enemy or combatant.

## Required states

- Idle: controlled breathing and small weight shift.
- Preparing: helmet/shield readiness.
- Focusing: low-frequency watch posture.
- Paused: shield lowered, stance maintained.
- Short break: water or quick equipment check.
- Long break: campfire/rest posture.
- Complete: banner placement or calm salute.
- Reform: neutral return after interruption.

## Technical delivery

- Source frame: `64 × 96` transparent pixels.
- 4–8 frames per state.
- Aseprite or equivalent layered source preferred.
- PNG sprite sheets as implementation exports.
- Shared palette and identical equipment across states.
- Pixel grid preserved.
- Integer-scale previews at 2×, 3× and 4×.
- State names and frame timing documented.

## Prohibited

- Gore or attack impacts.
- Copyrighted game character likenesses.
- Excessive flashing or large movement during focus.
- Smooth/bilinear interpolation.
- Generative texture inconsistency between states.
- Baked background or speech text.
