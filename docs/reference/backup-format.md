# Local Data Backup Format

VIGIL exports and imports all local data as a single JSON file, via **Export** /
**Import** in the campaign board. The file is portable and human-readable.

## Structure

- `version` (number) — bundle schema version; import rejects unknown versions.
- `campaigns` — `[{ id, name, status, createdAt }]`
- `missions` — `[{ id, title, victoryCondition, status, createdAt, completedAt, campaignId }]`
- `focusSessions` — `[{ id, missionId, state, plannedDurationSeconds, focusedDurationSeconds, startedAt, completedAt, outcome, totalPausedMs, pauseStartedAtMs, result, blocker, nextAction }]`
- `settings` — `[{ key, value }]` (e.g. the active campaign and the Doctrine break lengths)

Timestamps are epoch-millisecond strings, matching the SQLite storage.

## Import semantics

Import is **additive and non-destructive**: rows are inserted by primary key with
`INSERT OR IGNORE`, so existing records are never overwritten — importing can only
add what is missing. The whole import runs in one transaction, so a malformed file
rolls back entirely rather than half-importing. A round-trip (export, then import
into an empty profile) restores every record.

Everything stays local: no network or account is involved.
