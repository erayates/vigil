# v0.2.0 Dogfood Checklist

Runtime verification for everything the agent could only build/compile-test, not
run. Work through it in `npm run tauri:dev` (the real native windows — not the
`localhost:1420` Vite tab). Note anything wrong under **Findings**; I'll fix, then
we resume the remaining tasks (018–020).

> If `tauri:dev` says "cargo not found", run once in the same terminal:
> `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"`. Ensure some free disk
> (a debug build needs a few GB).

Legend: ⬜ to check · ✅ ok · ❌ issue (describe under Findings).

## Foundation (never runtime-verified)

- ⬜ App launches; both windows render (no blank webview / CSP block).
- ⬜ Start a watch in the main window → the companion window reflects it (mission, phase, countdown).
- ⬜ Reload one webview (companion or main) → same session continues, no second timer.
- ⬜ Kill the app mid-focus → reopen → the active session is restored with correct remaining time.
- ⬜ First launch on a clean profile creates the database without error.
- ⬜ Unplug/replug or change a monitor → the companion stays reachable (clamped on screen).

## VIGIL-013 — Debrief

- ⬜ Complete a watch → primary button reads **Debrief** → form (result / blocker / next action) → **Record** → returns to idle.
- ⬜ **Skip** on the debrief returns to idle without saving.
- ⬜ Abandon a watch → **Debrief** is offered there too.

## VIGIL-014 — Campaign

- ⬜ Create a campaign in the board → it becomes the active selection.
- ⬜ Start & complete a watch → it is attributed to the active campaign.
- ⬜ Switch the active campaign, then restart the app → the choice persisted.

## VIGIL-015 — Break + Doctrine

- ⬜ Set short/long break minutes (Recovery doctrine) → restart → values persist.
- ⬜ Header **Short Break** / **Long Break** starts a break countdown (companion shows the break sprite).
- ⬜ **End break** returns to idle; the break also counts down in the companion window.

## VIGIL-016 — Weekly summary

- ⬜ Complete a few watches → **This Week** bars + totals (focus time · watches) update.
- ⬜ With no recent sessions the week renders (empty bars), no error.

## VIGIL-021 — Companion preferences

- ⬜ Side **Left/Right** → the companion moves to that monitor edge.
- ⬜ Scale / opacity sliders change the companion **live** (no restart).
- ⬜ Restart → side/scale/opacity persist.

## VIGIL-022 — Export / import

- ⬜ **Export** downloads a `vigil-backup.json`.
- ⬜ **Import** that file → merges without duplicating or overwriting existing data.
- ⬜ Round-trip: export, wipe/fresh profile, import → all records restored.

## VIGIL-017 — System tray

- ⬜ Tray icon appears.
- ⬜ Tray **Show companion** reveals it and restores mouse interaction (click-through off).
- ⬜ Tray **Hide companion** / **Open VIGIL** / **Quit** work; left-click the tray opens the main window.
- ⬜ Enable **Close to tray** → closing the main window hides it to the tray (Quit still exits).

## VIGIL-019 / 018 / 020 — OS integration

- ⬜ Complete a watch → exactly **one** native notification appears ("Watch complete").
- ⬜ With the app unfocused, press **Ctrl+Shift+V** → the companion returns (mouse works again) and the main window surfaces.
- ⬜ Tray **Launch at login** → enable it → sign out/in (or reboot) → VIGIL starts automatically; disable → it no longer does.

## Findings

| #   | Feature | Observation | Severity (P0/P1/P2) |
| --- | ------- | ----------- | ------------------- |
|     |         |             |                     |
