# Pixel-UI Implementation Plan

## Why HTML + 9-slice

The interface contains dynamic task text, timer values, inputs and buttons. These must remain semantic and testable. Ornate frames are supplied as 9-slice images through CSS `border-image`, allowing corners to remain intact while panels resize.

## Current scaffold paths

```text
src/widgets/campaign-board/
src/widgets/focus-chamber/
src/widgets/companion-stage/
src/widgets/campaign-summary/
src/widgets/main-shell/
public/assets/ui/frames/
public/assets/ui/textures/
public/assets/pixel/
```

## Art replacement workflow

1. User/artist supplies source files for registry asset IDs.
2. Agent stops until files and approval are present.
3. Source is preserved under `assets/source/`.
4. Export script generates implementation PNGs.
5. Registry records checksum, dimensions and approved usage.
6. CSS token/path replacement occurs without changing domain behavior.
7. Visual baselines are reviewed and committed.

## Component-state matrix

| Component      | Default  | Hover    | Pressed  | Disabled | Focus    |
| -------------- | -------- | -------- | -------- | -------- | -------- |
| Session tab    | required | required | optional | required | required |
| Action button  | required | required | required | required | required |
| Task checkbox  | required | required | required | required | required |
| Mode chip      | required | required | required | required | required |
| Window control | required | required | required | n/a      | required |

## Production asset gate

`PROD-UI-001` and `PROD-COMP-001` are currently `request-user`. An agent implementing art lock must request these files and stop; it may not silently polish or upscale scaffold art and label it final.
