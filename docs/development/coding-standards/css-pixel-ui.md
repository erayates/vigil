# CSS and Pixel-UI Standards

## Rendering model

The UI is componentized HTML/CSS with raster ornament layers. It is not one flattened screenshot and not a full-canvas application.

- Functional text, timer values and task content remain HTML.
- Controls remain semantic HTML.
- Pixel assets provide frames, textures, icons, ornaments and sprite animation.
- Use CSS Grid for the principal 16:9 dashboard layout.
- Use `border-image`/9-slice assets for resizable ornate panels.

## Baseline dimensions

- Design baseline: `1600 × 900` logical CSS pixels.
- Minimum supported main window during foundation: `1280 × 800`.
- Companion source frame: `64 × 96` pixels.
- Prefer integer display scales: 2×, 3× and 4×.
- Test Windows scaling at 100%, 125%, 150% and 200% before hardening exit.

## Pixel fidelity

- Apply `image-rendering: pixelated` to pixel art and inherited descendants where necessary.
- Do not resize source sprites with bilinear export tools.
- Avoid fractional transforms for sprites.
- Keep animation positions aligned to whole CSS pixels.
- Texture tiles should be small and repeatable; avoid huge decorative backgrounds.
- 9-slice corners remain fixed; only edges and centre regions stretch/tile.

## Tokens

- Colours, spacing, borders, layer elevations and animation durations use custom properties.
- Do not introduce a slightly different bronze/red/stone value inside a component without a token decision.
- Dynamic inline styles are limited to measured values such as progress width.

## Interaction states

Every production control needs:

- default,
- hover,
- active/pressed,
- disabled,
- keyboard focus,
- reduced-motion behavior when animated.

Keyboard focus must not rely on colour alone and must remain visible above ornate borders.

## Asset rules

- Check `docs/assets/asset-registry.yaml` before adding a file path.
- Missing visual assets trigger the asset request protocol.
- Do not use remote URLs in CSS.
- Do not bundle font files.
- Decorative images use empty alternative text or CSS backgrounds.
- Meaningful icons receive accessible names through the control.

## Performance

- Prefer CSS sprite sheets for low-frame-count character loops.
- Pause nonessential animation when the window is hidden when practical.
- Avoid continuous large-area filters and blur effects.
- Measure idle CPU after production sprite integration.
