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
        M::up(
            // Campaigns group missions under a long-term goal. A key/value settings
            // table holds the active campaign so it survives restart. Existing
            // missions backfill to a seeded default campaign (no data loss).
            // campaign_id is a plain column (SQLite can't reliably ALTER-ADD a
            // foreign key); the app is the single writer and only sets valid ids.
            "CREATE TABLE campaigns (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL
            );
            CREATE TABLE settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            ALTER TABLE missions ADD COLUMN campaign_id TEXT;
            INSERT INTO campaigns (id, name, status, created_at)
                VALUES ('default', 'General Campaign', 'active', '0');
            UPDATE missions SET campaign_id = 'default';
            INSERT INTO settings (key, value) VALUES ('active_campaign_id', 'default');",
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
    fn campaign_migration_backfills_existing_missions_without_loss() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        let m = migrations();
        // Schema as it stood before the campaigns migration.
        m.to_version(&mut conn, 3).unwrap();
        conn.execute(
            "INSERT INTO missions (id, title, status, created_at)
             VALUES ('m1', 'Ship it', 'closed', '0')",
            [],
        )
        .unwrap();
        // Apply the campaigns migration.
        m.to_version(&mut conn, 4).unwrap();

        let campaign_id: String = conn
            .query_row(
                "SELECT campaign_id FROM missions WHERE id = 'm1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(campaign_id, "default");
        let active: String = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'active_campaign_id'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(active, "default");
    }

    /// How many migrations exist, read from a freshly migrated database so this
    /// suite keeps covering new steps without being edited.
    fn latest_version(migrations: &Migrations) -> usize {
        let mut conn = Connection::open_in_memory().unwrap();
        migrations.to_latest(&mut conn).unwrap();
        conn.query_row("PRAGMA user_version", [], |row| row.get::<_, i64>(0))
            .unwrap() as usize
    }

    /// Insert a mission + finished session using only columns that exist in the
    /// very first schema, so it can be seeded at any version.
    fn seed_session(conn: &Connection, tag: &str) {
        conn.execute(
            "INSERT INTO missions (id, title, status, created_at)
             VALUES (?1, ?2, 'closed', '0')",
            rusqlite::params![format!("m-{tag}"), format!("Mission {tag}")],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO focus_sessions
                (id, mission_id, state, planned_duration_seconds,
                 focused_duration_seconds, started_at, completed_at, outcome)
             VALUES (?1, ?2, 'complete', 1500, 1500, '1000', '2000', 'completed')",
            rusqlite::params![format!("s-{tag}"), format!("m-{tag}")],
        )
        .unwrap();
    }

    fn session_count(conn: &Connection) -> i64 {
        conn.query_row("SELECT count(*) FROM focus_sessions", [], |row| row.get(0))
            .unwrap()
    }

    #[test]
    fn every_migration_step_preserves_rows_written_before_it() {
        let migrations = migrations();
        for target in 2..=latest_version(&migrations) {
            let mut conn = Connection::open_in_memory().unwrap();
            conn.pragma_update(None, "foreign_keys", true).unwrap();

            // Schema as it stood one step earlier, with real data in it.
            migrations.to_version(&mut conn, target - 1).unwrap();
            seed_session(&conn, "x");
            assert_eq!(session_count(&conn), 1, "seeding failed before v{target}");

            // Apply exactly this one step.
            migrations.to_version(&mut conn, target).unwrap();

            assert_eq!(session_count(&conn), 1, "migration v{target} lost rows");
            let (id, focused): (String, i64) = conn
                .query_row(
                    "SELECT id, focused_duration_seconds FROM focus_sessions LIMIT 1",
                    [],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .unwrap();
            assert_eq!(id, "s-x", "migration v{target} rewrote the row id");
            assert_eq!(focused, 1500, "migration v{target} lost focused duration");
        }
    }

    #[test]
    fn upgrading_from_the_oldest_schema_keeps_every_record() {
        let migrations = migrations();
        let mut conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        migrations.to_version(&mut conn, 1).unwrap();
        seed_session(&conn, "a");
        seed_session(&conn, "b");

        migrations.to_latest(&mut conn).unwrap();

        assert_eq!(session_count(&conn), 2);
        // The campaign migration backfilled the pre-existing missions too.
        let attributed: i64 = conn
            .query_row(
                "SELECT count(*) FROM missions WHERE campaign_id = 'default'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(attributed, 2);
    }

    #[test]
    fn re_running_migrations_on_a_populated_database_changes_nothing() {
        let migrations = migrations();
        let mut conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        migrations.to_latest(&mut conn).unwrap();
        seed_session(&conn, "z");
        let before = session_count(&conn);

        migrations.to_latest(&mut conn).unwrap();

        assert_eq!(session_count(&conn), before);
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
