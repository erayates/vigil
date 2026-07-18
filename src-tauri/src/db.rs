use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

/// Numbered, forward-only migrations keyed on `PRAGMA user_version`.
pub fn migrations() -> Migrations<'static> {
    Migrations::new(vec![
        M::up(
            "CREATE TABLE missions (
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
        );",
        ),
        M::up(
            "ALTER TABLE focus_sessions ADD COLUMN total_paused_ms INTEGER NOT NULL DEFAULT 0;
             ALTER TABLE focus_sessions ADD COLUMN pause_started_at_ms INTEGER;",
        ),
        M::up(
            "ALTER TABLE focus_sessions ADD COLUMN result TEXT;
             ALTER TABLE focus_sessions ADD COLUMN blocker TEXT;
             ALTER TABLE focus_sessions ADD COLUMN next_action TEXT;",
        ),
    ])
}

/// Open (creating if needed) the database at `path`, enable foreign keys, and run
/// forward-only migrations to the latest schema. Pass ":memory:" for an ephemeral
/// database. Safe to call on a clean profile and safe to re-run.
pub fn open(path: &str) -> Result<Connection, String> {
    let mut conn = Connection::open(path).map_err(|error| error.to_string())?;
    conn.pragma_update(None, "foreign_keys", true)
        .map_err(|error| error.to_string())?;
    migrations()
        .to_latest(&mut conn)
        .map_err(|error| error.to_string())?;
    Ok(conn)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_validate() {
        assert!(migrations().validate().is_ok());
    }

    #[test]
    fn migrate_insert_and_read_back_a_session() {
        let conn = open(":memory:").unwrap();
        conn.execute(
            "INSERT INTO missions (id, title, status, created_at) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![
                "m1",
                "Ship the vertical slice",
                "active",
                "2026-07-18T09:00:00Z"
            ],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO focus_sessions
                (id, mission_id, state, planned_duration_seconds, started_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params!["s1", "m1", "focusing", 1500, "2026-07-18T09:00:00Z"],
        )
        .unwrap();

        let title: String = conn
            .query_row(
                "SELECT m.title FROM focus_sessions s
                 JOIN missions m ON m.id = s.mission_id WHERE s.id = ?1",
                rusqlite::params!["s1"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(title, "Ship the vertical slice");
    }

    #[test]
    fn migrating_a_clean_database_twice_is_safe() {
        let mut conn = Connection::open_in_memory().unwrap();
        migrations().to_latest(&mut conn).unwrap();
        migrations().to_latest(&mut conn).unwrap();
        let tables: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type = 'table'
                 AND name IN ('missions', 'focus_sessions', 'pause_intervals')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(tables, 3);
    }

    #[test]
    fn foreign_keys_are_enforced() {
        let conn = open(":memory:").unwrap();
        // With foreign keys on, a session pointing at a missing mission is rejected.
        let result = conn.execute(
            "INSERT INTO focus_sessions
                (id, mission_id, state, planned_duration_seconds, started_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params!["s1", "ghost", "focusing", 1500, "2026-07-18T09:00:00Z"],
        );
        assert!(result.is_err());
    }
}
