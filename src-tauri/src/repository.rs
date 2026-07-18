use crate::session::{Phase, SessionState};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;

pub struct StoredSession {
    pub id: String,
    pub mission_title: String,
    pub state: String,
    pub planned_duration_seconds: i64,
    pub focused_duration_seconds: i64,
    pub outcome: Option<String>,
}

fn phase_from_str(value: &str) -> Phase {
    match value {
        "preparing" => Phase::Preparing,
        "focusing" => Phase::Focusing,
        "paused" => Phase::Paused,
        "complete" => Phase::Complete,
        "abandoned" => Phase::Abandoned,
        _ => Phase::Idle,
    }
}

/// Mirror the authoritative session into SQLite (upsert). A no-op until the timer
/// has started — idle and preparing have no durable row (started_at is NOT NULL).
/// Timestamps are stored as epoch-millisecond strings.
pub fn record_session(
    conn: &Connection,
    state: &SessionState,
    focused_secs: u64,
    now_ms: i64,
) -> Result<(), String> {
    let (Some(id), Some(mission_id), Some(started)) = (
        state.id.clone(),
        state.mission_id.clone(),
        state.started_at_ms,
    ) else {
        return Ok(());
    };

    conn.execute(
        "INSERT INTO missions (id, title, victory_condition, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             victory_condition = excluded.victory_condition,
             status = excluded.status",
        params![
            mission_id,
            state.mission_title,
            state.victory_condition,
            if state.phase.is_terminal() {
                "closed"
            } else {
                "active"
            },
            now_ms.to_string(),
        ],
    )
    .map_err(|error| error.to_string())?;

    let completed_at = state.phase.is_terminal().then(|| now_ms.to_string());
    let outcome = match state.phase {
        Phase::Complete => Some("completed"),
        Phase::Abandoned => Some("abandoned"),
        _ => None,
    };
    conn.execute(
        "INSERT INTO focus_sessions
            (id, mission_id, state, planned_duration_seconds, focused_duration_seconds,
             started_at, completed_at, outcome, total_paused_ms, pause_started_at_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(id) DO UPDATE SET
             state = excluded.state,
             focused_duration_seconds = excluded.focused_duration_seconds,
             completed_at = excluded.completed_at,
             outcome = excluded.outcome,
             total_paused_ms = excluded.total_paused_ms,
             pause_started_at_ms = excluded.pause_started_at_ms",
        params![
            id,
            mission_id,
            state.phase.as_str(),
            state.planned_duration_secs as i64,
            focused_secs as i64,
            started.to_string(),
            completed_at,
            outcome,
            state.total_paused_ms,
            state.pause_started_at_ms,
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

/// Attach the debrief (result, blocker, next action) to a finished session row.
/// Blank fields are stored as NULL so a skipped answer stays absent. Only the
/// debrief columns are touched — state, outcome and completion time are untouched.
pub fn save_debrief(
    conn: &Connection,
    session_id: &str,
    result: &str,
    blocker: &str,
    next_action: &str,
) -> Result<(), String> {
    fn none_if_blank(value: &str) -> Option<&str> {
        let trimmed = value.trim();
        (!trimmed.is_empty()).then_some(trimmed)
    }
    conn.execute(
        "UPDATE focus_sessions SET result = ?2, blocker = ?3, next_action = ?4 WHERE id = ?1",
        params![
            session_id,
            none_if_blank(result),
            none_if_blank(blocker),
            none_if_blank(next_action),
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

/// The one-active-session invariant: never more than one non-terminal session.
pub fn active_session_count(conn: &Connection) -> Result<i64, String> {
    conn.query_row(
        "SELECT count(*) FROM focus_sessions WHERE state IN ('focusing', 'paused')",
        [],
        |row| row.get(0),
    )
    .map_err(|error| error.to_string())
}

/// Reconstruct the single active (focusing/paused) session for restart recovery.
pub fn active_session(conn: &Connection) -> Result<Option<SessionState>, String> {
    conn.query_row(
        "SELECT s.id, s.mission_id, m.title, m.victory_condition, s.state,
                s.planned_duration_seconds, s.started_at, s.total_paused_ms, s.pause_started_at_ms
         FROM focus_sessions s
         JOIN missions m ON m.id = s.mission_id
         WHERE s.state IN ('focusing', 'paused')
         LIMIT 1",
        [],
        |row| {
            let state_str: String = row.get(4)?;
            let started_str: String = row.get(6)?;
            Ok(SessionState {
                id: Some(row.get(0)?),
                mission_id: Some(row.get(1)?),
                phase: phase_from_str(&state_str),
                mission_title: row.get(2)?,
                victory_condition: row.get(3)?,
                planned_duration_secs: row.get::<_, i64>(5)? as u64,
                started_at_ms: started_str.parse::<i64>().ok(),
                total_paused_ms: row.get(7)?,
                pause_started_at_ms: row.get(8)?,
            })
        },
    )
    .optional()
    .map_err(|error| error.to_string())
}

pub fn list_recent(conn: &Connection, limit: i64) -> Result<Vec<StoredSession>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT s.id, m.title, s.state, s.planned_duration_seconds,
                    s.focused_duration_seconds, s.outcome
             FROM focus_sessions s
             JOIN missions m ON m.id = s.mission_id
             ORDER BY s.started_at DESC
             LIMIT ?1",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![limit], |row| {
            Ok(StoredSession {
                id: row.get(0)?,
                mission_title: row.get(1)?,
                state: row.get(2)?,
                planned_duration_seconds: row.get(3)?,
                focused_duration_seconds: row.get(4)?,
                outcome: row.get(5)?,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

/// A finished (completed or abandoned) session, shaped for the frontend history.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryRecord {
    pub id: String,
    pub mission_title: String,
    pub victory_condition: String,
    pub planned_duration_seconds: i64,
    pub focused_duration_seconds: i64,
    pub completed_at_ms: i64,
    pub outcome: String,
}

/// The most recent finished sessions, newest first (for dashboard statistics).
pub fn recent_records(conn: &Connection, limit: i64) -> Result<Vec<HistoryRecord>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT s.id, m.title, m.victory_condition, s.planned_duration_seconds,
                    s.focused_duration_seconds, s.completed_at, s.outcome
             FROM focus_sessions s
             JOIN missions m ON m.id = s.mission_id
             WHERE s.state IN ('complete', 'abandoned')
             ORDER BY s.completed_at DESC
             LIMIT ?1",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![limit], |row| {
            let completed_at: Option<String> = row.get(5)?;
            Ok(HistoryRecord {
                id: row.get(0)?,
                mission_title: row.get(1)?,
                victory_condition: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                planned_duration_seconds: row.get(3)?,
                focused_duration_seconds: row.get(4)?,
                completed_at_ms: completed_at
                    .and_then(|value| value.parse().ok())
                    .unwrap_or(0),
                outcome: row.get::<_, Option<String>>(6)?.unwrap_or_default(),
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;

    fn focusing_session() -> SessionState {
        let mut s = SessionState::idle();
        s.start(
            "s1".into(),
            "m1".into(),
            "Ship slice".into(),
            String::new(),
            1500,
        )
        .unwrap();
        s.begin(1_000).unwrap();
        s
    }

    fn paused_session() -> SessionState {
        let mut s = focusing_session();
        s.pause(61_000).unwrap(); // 60s focused, then paused
        s
    }

    #[test]
    fn preparing_session_is_not_persisted() {
        let conn = db::open(":memory:").unwrap();
        let mut s = SessionState::idle();
        s.start("s1".into(), "m1".into(), "m".into(), String::new(), 1500)
            .unwrap();
        record_session(&conn, &s, 0, 2_000).unwrap();
        assert_eq!(active_session_count(&conn).unwrap(), 0);
        assert!(list_recent(&conn, 10).unwrap().is_empty());
    }

    #[test]
    fn re_recording_an_active_session_keeps_one_row() {
        let conn = db::open(":memory:").unwrap();
        let s = focusing_session();
        record_session(&conn, &s, 60, 61_000).unwrap();
        record_session(&conn, &s, 90, 91_000).unwrap();
        assert_eq!(active_session_count(&conn).unwrap(), 1);
    }

    #[test]
    fn completed_session_is_stored_and_leaves_no_active_session() {
        let conn = db::open(":memory:").unwrap();
        let mut s = focusing_session();
        record_session(&conn, &s, 60, 61_000).unwrap();
        s.complete().unwrap();
        record_session(&conn, &s, 60, 61_000).unwrap();
        assert_eq!(active_session_count(&conn).unwrap(), 0);
        assert!(active_session(&conn).unwrap().is_none());
        let recent = list_recent(&conn, 10).unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].mission_title, "Ship slice");
        assert_eq!(recent[0].outcome.as_deref(), Some("completed"));
    }

    #[test]
    fn records_survive_reopening_the_database() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("vigil.db");
        let path_str = path.to_str().unwrap();
        {
            let conn = db::open(path_str).unwrap();
            let mut s = focusing_session();
            s.complete().unwrap();
            record_session(&conn, &s, 120, 121_000).unwrap();
        }
        let conn = db::open(path_str).unwrap();
        let recent = list_recent(&conn, 10).unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].id, "s1");
        assert_eq!(recent[0].focused_duration_seconds, 120);
    }

    #[test]
    fn no_active_session_in_an_empty_database() {
        let conn = db::open(":memory:").unwrap();
        assert!(active_session(&conn).unwrap().is_none());
    }

    #[test]
    fn active_paused_session_recovers_across_reopen_with_frozen_time() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("vigil.db");
        let path_str = path.to_str().unwrap();
        {
            let conn = db::open(path_str).unwrap();
            record_session(&conn, &paused_session(), 60, 61_000).unwrap();
        }
        let conn = db::open(path_str).unwrap();
        let recovered = active_session(&conn).unwrap().expect("an active session");
        assert_eq!(recovered.phase, Phase::Paused);
        assert_eq!(recovered.id.as_deref(), Some("s1"));
        assert_eq!(recovered.started_at_ms, Some(1_000));
        assert_eq!(recovered.pause_started_at_ms, Some(61_000));
        // Paused time is frozen: 60s focused regardless of how long the app was down.
        assert_eq!(recovered.remaining_secs(999_000_000), 1440);
    }

    #[test]
    fn completing_a_recovered_session_does_not_duplicate_the_record() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("vigil.db");
        let path_str = path.to_str().unwrap();
        {
            let conn = db::open(path_str).unwrap();
            record_session(&conn, &focusing_session(), 60, 61_000).unwrap();
        }
        let conn = db::open(path_str).unwrap();
        let mut recovered = active_session(&conn).unwrap().expect("an active session");
        recovered.complete().unwrap();
        record_session(&conn, &recovered, 60, 62_000).unwrap();
        assert_eq!(list_recent(&conn, 10).unwrap().len(), 1); // one record, not two
        assert!(active_session(&conn).unwrap().is_none());
    }

    #[test]
    fn save_debrief_attaches_fields_and_blanks_become_null() {
        let conn = db::open(":memory:").unwrap();
        let mut s = focusing_session();
        s.complete().unwrap();
        record_session(&conn, &s, 90, 100_000).unwrap();

        save_debrief(&conn, "s1", "Shipped the parser", "   ", "Write tests").unwrap();

        let (result, blocker, next): (Option<String>, Option<String>, Option<String>) = conn
            .query_row(
                "SELECT result, blocker, next_action FROM focus_sessions WHERE id = ?1",
                params!["s1"],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(result.as_deref(), Some("Shipped the parser"));
        assert_eq!(blocker, None); // whitespace-only -> NULL
        assert_eq!(next.as_deref(), Some("Write tests"));
        // The debrief must not disturb the finished row's outcome.
        assert_eq!(
            list_recent(&conn, 10).unwrap()[0].outcome.as_deref(),
            Some("completed")
        );
    }

    #[test]
    fn recent_records_returns_finished_sessions_with_completion_time() {
        let conn = db::open(":memory:").unwrap();
        let mut s = focusing_session();
        s.complete().unwrap();
        record_session(&conn, &s, 90, 100_000).unwrap();

        let records = recent_records(&conn, 10).unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].mission_title, "Ship slice");
        assert_eq!(records[0].focused_duration_seconds, 90);
        assert_eq!(records[0].completed_at_ms, 100_000);
        assert_eq!(records[0].outcome, "completed");
    }
}
