# Idle resource budget

VIGIL is meant to sit open all day. An app you have to close to get your
battery back is not a focus companion, so idle cost is a product requirement,
not an optimisation.

## Budget

"Idle" means the app is running in the Idle phase: no watch, no break, no
countdown. Both windows may be open.

| Resource | Budget when idle | Rationale |
| --- | --- | --- |
| CPU | < 1% of one core, averaged over a minute | Below the threshold where a laptop fan or battery meter notices |
| Memory (private bytes, all processes) | < 300 MB | Two WebView2 instances is the floor for this stack; private bytes is the honest figure, working set double-counts shared pages |
| Disk writes | 0 while idle | Nothing is persisted until a watch starts |
| Network | 0, always | VIGIL never makes a network request |

During a watch the countdown ticks four times a second, so CPU is allowed to
rise; that is bounded work and not covered by this budget.

## What runs while idle

Nothing, by design, and this is enforced by a test rather than a promise:

- **Countdown timers** — `FocusChamber` and `CompanionOverlay` both create their
  250 ms interval inside an effect gated on `phase === 'focusing' || 'break'`,
  and clear it on the way out. `focus-chamber.test.tsx` renders the idle shell,
  advances fake timers by a minute, and asserts both that `tick` was never
  called and that the timer count is zero.
- **Event listeners** — the `session://changed` and `companion://prefs`
  listeners stay subscribed, but they are event-driven. They cost nothing
  between broadcasts, and idle produces no broadcasts.
- **Rust side** — no background thread, no polling loop. State changes only in
  response to an IPC command.
- **Animation** — the brazier flicker and the companion sprite are CSS
  animations, and they turned out to be the entire idle cost. **WebView2 does
  not throttle a window that is minimised or hidden**: it keeps painting every
  frame for nobody. Two rules fix it, both hanging off one
  `is-window-unfocused` class that parks every animation:
  - the main window sets it whenever it loses focus
    (`shared/lib/pause-when-unfocused.ts`),
  - the companion window sets it whenever there is no watch to show — it is
    hidden then, and a hidden window animating a sprite was costing more than
    everything else combined.

  Under `prefers-reduced-motion` both stop entirely regardless.

## Measurements

Method: release build (`npm run tauri:build`), launched, left in Idle, main
window minimised, companion hidden, tray active. All descendant processes are
included — the shell process alone is misleading, because the WebView2
renderer and GPU processes are where the work happens. CPU is the delta in
processor seconds over a 60 s window after a settle period, divided by 60.

Machine: Windows 10 Pro 19045, WebView2 150.0.4078.83.

| Date | Version | Idle CPU | Private bytes | Working set | Verdict |
| --- | --- | --- | --- | --- | --- |
| 2026-07-20 | 0.2.0 (before fix) | 10.39% | — | 488 MB | **Over budget** — animations never parked |
| 2026-07-20 | 0.2.0 (main window parked) | 6.82% | — | 500 MB | Still over — the hidden companion was the rest |
| 2026-07-20 | 0.2.0 (both parked) | **0.10%** | **261 MB** | 474 MB | Within budget |

The first row is the honest starting point: an app that quietly ate a tenth of
a core all day, minimised, doing nothing. Nothing about it was visible in the
code — no timer, no loop — which is exactly why this budget is measured rather
than reasoned about.

Re-measure whenever a timer, animation or background task is added. A row that
breaks the budget is a bug, not a new baseline.
