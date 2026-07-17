# Persistence Plan

## Prototype

The scaffold uses Zustand local persistence to demonstrate the flow in a browser. This is not the v0.1.0 final persistence architecture because separate webviews do not share a single reliable source of truth.

## v0.1.0 target

SQLite tables:

```sql
CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  victory_condition TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  state TEXT NOT NULL,
  planned_duration_seconds INTEGER NOT NULL,
  focused_duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  outcome TEXT,
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE TABLE pause_intervals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  FOREIGN KEY (session_id) REFERENCES focus_sessions(id)
);
```

## Migrations

- Numbered, forward-only migrations.
- Schema version stored by the SQL migration mechanism.
- Pre-release destructive changes are allowed only with documented export implications.
- v1.0+ migrations must preserve user data.
