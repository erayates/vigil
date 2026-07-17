# Supplied UI Reference Breakdown

## Source

- Registry ID: `REF-UI-001`
- File: `docs/assets/legio-focus-ui-reference.png`
- Dimensions: `1672 × 941`
- Aspect ratio: approximately `16:9`
- Status: `reference-only`

## Component inventory

1. Gold/bronze outer application frame.
2. Red marble custom title/header region.
3. Brand lockup and thematic motto.
4. Three large session-mode tabs.
5. Statistics/settings utility controls.
6. Custom window controls.
7. Today's campaign task list.
8. Task priority markers and queue controls.
9. Parchment focus chamber with central timer.
10. Four colour-coded action controls.
11. Roman architectural companion stage.
12. Speech card, standard/banner and brazier.
13. Campaign progress panel.
14. Four summary metric cells.
15. Bottom motto ribbon.

## What is adopted

- overall density and hierarchy,
- panel distribution,
- Roman material palette,
- ornate pixel frames,
- prominent companion stage,
- colour-coded action controls,
- campaign/status language.

## What is not copied blindly

- baked English task text,
- exact embedded heraldry,
- any artwork whose source/provenance is unknown,
- flattened button images with baked labels,
- a literal one-image application implementation.

## Implementation mapping

| Reference region | React/CSS implementation                    |
| ---------------- | ------------------------------------------- |
| Header           | `MainShell` command header and session tabs |
| Campaign list    | `CampaignBoard`                             |
| Timer            | `FocusChamber`                              |
| Soldier area     | `CompanionStage` + `PixelCompanion`         |
| Bottom progress  | `CampaignSummary`                           |
| Frame/texture    | generated scaffold 9-slice and tiles        |

## Fidelity validation

Evaluate at `1600 × 900` with:

- silhouette and density comparison,
- alignment and panel proportion comparison,
- timer dominance,
- companion prominence,
- keyboard-focus visibility,
- text legibility over parchment and stone.
