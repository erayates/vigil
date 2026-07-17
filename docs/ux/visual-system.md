# Roman Pixel-Art Visual System

## Direction lock

The primary direction is the user-supplied reference `REF-UI-001`:

- dense desktop game-interface composition,
- oxblood/red command header,
- bronze and gold structural ornament,
- parchment task and timer surfaces,
- dark stone architectural framing,
- large Roman legionary companion at the right,
- campaign progress and statistics across the bottom,
- clear 16:9 hierarchy.

The product remains original. The reference is a layout/style brief, not a raster background to ship.

## Rendering strategy

```text
Semantic React components
├── live task and timer text
├── accessible buttons, inputs and tabs
├── CSS Grid layout
├── 9-slice pixel frames through border-image
├── repeating low-resolution textures
└── state-driven character sprite sheets
```

Do not implement the interface as:

- one giant image with clickable hotspots,
- a canvas-only application,
- AI-generated screens containing baked text,
- a responsive web landing page aesthetic.

## Main-window layout

Baseline: `1600 × 900` logical pixels.

```text
┌──────────────────────────────────────────────────────────────┐
│ Brand             Focus / Short / Long             Utilities │
├──────────────────┬───────────────────────┬───────────────────┤
│ Today's Campaign │      Focus Time       │    Companion      │
│ Mission + queue  │      Timer/actions    │    Message/flag   │
├──────────────────┴───────────────────────┴───────────────────┤
│ Campaign progress          Sessions / Formation / Time       │
├──────────────────────────────────────────────────────────────┤
│                  DISCIPLINA EST VICTORIA                     │
└──────────────────────────────────────────────────────────────┘
```

Approximate main columns:

- campaign board: 29–31%,
- focus chamber: 42–44%,
- companion stage: 25–28%.

## Visual roles

| Layer          | Use                                                 |
| -------------- | --------------------------------------------------- |
| Dark stone     | shell, secondary controls, architectural background |
| Oxblood marble | active tabs, banners, brand header                  |
| Parchment      | primary task/timer surfaces                         |
| Bronze/gold    | borders, focus, laurel and hierarchy                |
| Green          | Start/positive activation                           |
| Red            | Pause/active warning                                |
| Orange         | Reset/maintenance                                   |
| Purple         | Skip/future navigation                              |

## Typography

- No bundled or remote font files.
- System serif stack for Roman/editorial labels.
- System monospace stack for timer values and technical metadata.
- Text remains readable when textures fail to load.
- Functional text is never baked into a raster asset.

## Sprite system

Scaffold source frame: `64 × 96` px, four frames per state.

Required production states:

- idle,
- preparing,
- focusing,
- paused,
- short break,
- long break,
- completed,
- reform/return.

Focus animation is subtle. No gore, impact flashes, aggressive shaking or continuous attention-demanding motion.

## Scaling

- Prefer 2×, 3× and 4× sprite display scales.
- Use `image-rendering: pixelated`.
- Avoid fractional transforms and fractional sprite positioning.
- Test Windows DPI at 100%, 125%, 150% and 200%.
- Main layout may compress, but core task/timer/control content may not become unreadable.

## Asset approval

The current generated textures, frames, mark and legionary are `scaffold-only`. Production replacement triggers `docs/agent/asset-request-protocol.md`. The agent must ask the user for missing production art rather than inventing it.
