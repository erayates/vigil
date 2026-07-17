# Window Behavior

## Main window

- Baseline size: `1600 × 900`.
- Minimum foundation size: `1280 × 800`.
- Undecorated Tauri window with an in-app command header.
- Header supplies minimize, maximize/restore and close controls.
- A visible keyboard focus path is required for all window controls.
- The main window remains resizable; 16:9 is the visual baseline, not a forced lock.
- Window-state persistence is scheduled after the cross-window state owner is selected.

## Companion window

- Transparent, frameless and always-on-top.
- Independent from the rich main dashboard.
- Shows character, active mission, remaining time and minimal controls.
- User can hide it without ending a session.
- Click-through can only be enabled when a guaranteed recovery path exists.
- Off-screen coordinates are repaired after display changes.

## Multi-window invariant

Main and companion windows display the same authoritative focus session. Independent persisted Zustand stores are prototype-only and must be replaced before `v0.1.0`.

## Fullscreen behavior

The user chooses whether the companion remains visible above fullscreen applications. The default is conservative and may hide over exclusive fullscreen contexts.

## Foundation size behavior

The art/layout baseline is 1600×900. The native window may be reduced to 1280×800 during foundation work; below the 900-pixel design height the shell may scroll rather than fractionally scale raster ornamentation. A compact no-scroll layout is a separate `v0.0.3` acceptance item and must not be approximated by distorting sprites or 9-slice corners.
