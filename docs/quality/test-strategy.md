# Test Strategy

## Unit

- Duration formatting and timestamp arithmetic.
- State transitions and invalid commands.
- Idempotent completion.
- Statistics/progress derivation.
- Migration parsing and domain mapping.

## Component/integration

- Mission editing and duration selection.
- Control disabled/enabled states by phase.
- Main dashboard semantic roles and keyboard focus.
- Main/companion presentation consistency.
- Asset failures preserve readable text and controls.

## Native integration

- SQLite repositories and migrations.
- Tauri command → domain service → repository.
- Cross-window event/state synchronization.
- Restart recovery.
- Window-control commands.

## E2E

- Create mission and start.
- Pause/resume.
- Early/natural completion.
- Force close and recover.
- Click-through recovery.
- Display removal where feasible.

## Visual regression — v0.0.3

- 1600×900 baseline dashboard.
- 1280×800 minimum supported layout.
- deterministic mission/history seed,
- frozen clock,
- disabled CSS animation,
- explicit review for frame/sprite changes,
- production baselines only after asset approval.

## Manual Windows matrix

- Windows 11 at 100%, 125%, 150% and 200% scaling.
- Single and dual monitor.
- Sleep/resume.
- Fullscreen application.
- Notification permission off.
- Companion on left/right edge.
- Keyboard-only navigation.
- Reduced motion enabled.

## Performance budgets

- Idle average CPU < 1% after stabilization.
- Focus mode average CPU < 2% with low-frame sprite animation.
- Main bundle < 500 KB compressed before major visualization systems.
- No continuous large-area blur/filter animation.
