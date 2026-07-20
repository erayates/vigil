# Multi-monitor placement matrix

Where the companion goes in each display configuration, and what happens when
that configuration changes. Positions are physical pixels; the companion is
240×360 with a 28px drag strip along its top.

## The rule

One rule covers every row below: **the companion stays exactly where the user
put it, unless it can no longer be grabbed.** A window is grabbable when at
least 96px of its drag strip lies on some monitor. Anything less — the strip
pushed above a screen edge, a sliver poking in from the side, a monitor gone —
and it is moved to the top-left of the primary work area, where it is always
reachable. `clamp_to_work_areas` in `src-tauri/src/window.rs` is that rule, and
its unit tests are this table in executable form.

Body visibility is deliberately not the test. A companion whose body fills the
screen but whose handle sits at y = −40 is lost, even though the user can see
it; a companion showing only its top strip is fine, because it can be dragged
back.

## Configurations

| Configuration | Placement on start | Side toggle (left/right) |
| --- | --- | --- |
| Single monitor | Last saved position, if grabbable | Snaps to that monitor's edge, 24px margin |
| Two monitors, side by side | Last saved position, whichever display it is on | Snaps to the edge of **the monitor it is currently on** |
| Two monitors, stacked | Last saved position | Same — the current monitor's edge |
| Mixed DPI (100% / 150%) | Last saved physical position | Physical coordinates throughout; no scale conversion is applied |
| Laptop lid closed, external only | Position on the vanished panel fails the grab test → primary top-left | Primary monitor's edge |

## Changes to a running configuration

| Change | Behaviour |
| --- | --- |
| Monitor unplugged, companion was on it | Rescued to primary top-left on next start |
| Monitor resolution reduced | Rescued only if the strip no longer has 96px on a monitor |
| Monitor rearranged (left ↔ right) | Work areas move with it; a position that still intersects is kept |
| Display scale changed | Physical work areas change; same grab test applies |
| All monitors reported as none | Position is left untouched — never guess when nothing is known |

## Known limitation

Rescue runs **at startup**, not on a live display-change event. Unplug a monitor
mid-session and the companion can sit off-screen until the next launch. The tray
"Show companion" entry does not reposition it either. A display-change hook is
the fix; it is not wired because Tauri exposes no portable event for it, and the
workaround (restart, or toggle the companion side) is cheap. Revisit if dogfood
shows the mid-session case actually happening.
