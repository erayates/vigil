# Accessibility review

Scope: the main window and the companion window as they stand in v0.4.0
development. Reviewed against the VIGIL-035 acceptance criteria.

## Reduced motion

A global `prefers-reduced-motion: reduce` block in `src/app/styles/global.css`
collapses every animation and transition. Two animations were checked
individually because their frozen state matters:

- **Companion sprite** (`legionary-sprite`) — a sprite sheet stepped through
  with `background-position-x`. The global override alone left the resting
  frame to chance, so `pixel-companion.css` now disables the animation
  explicitly and pins frame 1. The companion stays a legionary, motionless.
- **Brazier flicker** (`main-shell.css`) — purely decorative. The global
  override is enough; the braziers simply stop flickering.

Nothing conveys state through motion alone: every phase is also carried by
text, so removing motion removes no information.

## Accessible names and roles

Every interactive control in the main window has a computed accessible name.
This is enforced, not just reviewed — `main-shell.test.tsx` renders the shell
and asserts that the count of buttons, radios and textboxes with a non-blank
accessible name equals the total count. A control that grows an icon and
loses its label fails the suite.

Names come from three sources, in order of preference:

- visible text (`<strong>Start</strong>`, `Add`, `End break`),
- an associated `<label>` (mission title, victory condition, debrief fields),
- `aria-label` where the control is icon-only (window controls, header
  actions, the import file input) or where the visible text is ambiguous out
  of context (focus-mode radios name their duration).

Decorative glyphs (`❧`, `◆`, `▶`, brazier and laurel spans) are all
`aria-hidden`, so they never pollute a name.

## Announcements

The countdown updates roughly four times a second. It is deliberately **not**
inside a live region — `<time>` carries an `aria-label` for on-demand reading
only, and a test asserts it has no `[aria-live]` ancestor.

Phase changes are announced instead, once each, by the single
`role="status"` motto line in the focus chamber. The suspend-gap prompt is
also `role="status"`, so it is read when it appears without stealing focus.
The startup notice uses `role="alert"`, which is correct: a preserved data
file is the one message that should interrupt.

## Known gaps

- No keyboard shortcut documentation surface in-app; the global shortcut is
  discoverable only through settings.
- Colour contrast has not been measured against WCAG AA. The parchment
  palette is high-contrast by eye, but this deserves a real measurement pass
  before 1.0.
- The companion window has no focusable controls at all, so keyboard users
  reach it only through the tray. Acceptable while it stays a pure display
  surface; revisit if it gains controls.
