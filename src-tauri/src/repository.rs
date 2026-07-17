use crate::session::{Phase, SessionState};
use rusqlite::{params, Connection};

pub struct StoredSession {
    pub id: String,
    pub mission_title: String,
    pub state: String,
    pub planned_duration_seconds: i64,
    pub focused_duration_seconds: i64,
    pub outcome: Option<String>,
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
             started_at, completed_at, outcome)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
             state = excluded.state,
             focused_duration_seconds = excluded.focused_duration_seconds,
             completed_at = excluded.completed_at,
             outcome = excluded.outcome",
        params![
            id,
            mission_id,
            state.phase.as_str(),
            state.planned_duration_secs as i64,
            focused_secs as i64,
            started.to_string(),
            completed_at,
            outcome,
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
}
