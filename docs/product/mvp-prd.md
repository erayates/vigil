# MVP Product Requirements — v0.1.0

## Problem

Existing focus timers often fail to reduce activation friction or create sustained emotional continuity. Users start a generic countdown while the task remains vague, and the interface gives little sense of commitment or accumulated effort.

## Product hypothesis

A non-intrusive desktop companion tied to a mission-definition ritual and a distinctive Roman campaign interface will increase the percentage of started sessions that are completed and make users more likely to begin another session later.

## Target user

A computer-based knowledge worker who:

- has a concrete task but delays starting,
- switches contexts frequently,
- finds plain timers sterile,
- appreciates game-interface feedback but does not want a full productivity RPG,
- wants structure without a complex project-management system.

## Core job to be done

> When I need to do focused computer work, help me define one finishable result, enter a deliberate focus state, remain aware of that commitment and close the session with a useful record.

## Experience surfaces

### Main campaign dashboard

A dense 16:9 Roman pixel-art interface containing:

- brand and session-mode command header,
- today's campaign/mission board,
- dominant focus timer and actions,
- Roman companion stage,
- campaign progress and local statistics.

### Desktop companion

A separate transparent always-on-top window showing only the character, mission, remaining time and minimal controls.

The rich main dashboard and minimal companion are complementary, not duplicates.

## Required user flow

1. User creates a mission title.
2. User optionally writes an observable victory condition.
3. User selects 15, 25, 50, 90 or custom duration.
4. User starts the session.
5. Companion moves from preparing to focusing.
6. User may pause and resume.
7. Timer remains accurate across throttling, sleep and UI rerenders.
8. User completes or abandons the session.
9. Session is stored locally.
10. Main dashboard statistics update from the accepted record.

## Functional requirements

### Mission

- Maximum one active mission.
- Title required, 1–100 characters.
- Victory condition optional in v0.1.0, 0–240 characters.
- Priority is presentation metadata until campaign persistence is introduced.

### Focus session

- Presets: 15, 25, 50 and 90 minutes.
- Custom: 1–240 minutes.
- States follow the canonical state machine.
- Remaining time is derived from timestamps.
- Duplicate active sessions are impossible.
- Completion is idempotent.

### Main dashboard

- Timer is the dominant focal element.
- Task text and controls are live semantic HTML.
- Main layout baseline is 1600×900 and remains usable from 1280×800.
- Short/long-break tabs may appear disabled before Doctrine is implemented.
- Unimplemented controls are visibly disabled and identify their target version.

### Companion

- Separate transparent always-on-top window.
- Idle, preparing, focusing, paused, break and complete states.
- User can show/hide it.
- Click-through must never trap the user.

### Local history and statistics

- Store completed and abandoned records locally.
- No account or cloud service.
- Derive today's sessions, today's focus time and all-time focus time.
- Progression/streak values stay unavailable until their defined phase.

## Visual requirements

- Use the direction in `docs/ux/visual-system.md` and `REF-UI-001`.
- Use semantic HTML + CSS Grid + 9-slice raster frames.
- Do not ship the supplied reference as a flattened application background.
- Do not bake dynamic text into raster assets.
- Use only approved production art; missing art triggers the asset request protocol.
- Generated repository assets are scaffold-only.

## Non-functional requirements

- Start-to-interactive target under two seconds on typical supported Windows hardware.
- Idle CPU target below 1% averaged over one minute after stabilization.
- Timer error below one second after system sleep/resume.
- Keyboard-accessible essential controls and window controls.
- Visible focus states over ornate frames.
- Reduced-motion mode respected.
- No remote fonts, scripts, UI assets or tracking.
- Least-privilege Tauri capabilities.

## Out of scope for v0.1.0

Persistent campaigns, automatic break doctrine, progression, ranks, camp building, cloud sync, AI coaching, social rooms, website blocking, calendar integrations and mobile apps.

## Success measures

- At least 70% of started test sessions reach completion or intentional early completion.
- At least 60% of testers start a second session within seven days.
- At least 70% report the companion is neutral or helpful rather than distracting.
- Median time from app open to session start under 60 seconds.
- At least 80% of test users correctly identify the primary mission and Start action without facilitator help.

## Exit criteria

All acceptance tests in `docs/roadmap/phases/P1-v0.1-vertical-slice.md` pass on the documented Windows matrix, production-required assets are approved or explicitly deferred, and no P0/P1 defects remain.
