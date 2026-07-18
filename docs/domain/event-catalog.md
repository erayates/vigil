# Domain Event Catalog

| Event                        | Introduced | Purpose                                       |
| ---------------------------- | ---------: | --------------------------------------------- |
| `MissionDefined`             |      0.1.0 | Snapshot the active mission                   |
| `FocusSessionStarted`        |      0.1.0 | Establish authoritative timestamps            |
| `FocusSessionPaused`         |      0.1.0 | Begin pause interval                          |
| `FocusSessionResumed`        |      0.1.0 | Close pause interval                          |
| `FocusSessionCompleted`      |      0.1.0 | Produce immutable outcome record              |
| `FocusSessionAbandoned`      |      0.1.0 | Record interruption without deleting progress |
| `DebriefRecorded`            |      0.2.0 | Store result, blocker and next action         |
| `CampaignProgressed`         |      0.2.0 | Attribute accepted focus duration             |
| `DisciplinaAwarded`          |      0.3.0 | Derive progression from session rules         |
| `CompanionPreferenceChanged` |      0.2.0 | Persist window/avatar preference              |

## Cross-window transport

Not a domain event — the Tauri IPC broadcast that keeps both windows in sync.

| Event               | Introduced | Purpose                                                                                                                   |
| ------------------- | ---------: | ------------------------------------------------------------------------------------------------------------------------- |
| `session://changed` |      0.0.4 | Rust core broadcasts the authoritative `SessionSnapshot` to every window after each session command (VIGIL-001, ADR-007). |
