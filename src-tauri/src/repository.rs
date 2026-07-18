use crate::session::{Phase, SessionState};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

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

    // Attribute the mission to the campaign that was active when it first landed.
    // campaign_id is set on INSERT only (absent from DO UPDATE), so switching the
    // active campaign mid-session never re-attributes a running mission.
    let campaign_id = active_campaign_id(conn)?;
    conn.execute(
        "INSERT INTO missions (id, title, victory_condition, status, created_at, campaign_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
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
            campaign_id,
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

/// A long-term project container. Missions attribute their focus time to one.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Campaign {
    pub id: String,
    pub name: String,
    pub status: String,
}

/// The full campaign picture for the frontend: every campaign plus the active id.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignSnapshot {
    pub campaigns: Vec<Campaign>,
    pub active_id: String,
}

/// Generic key/value settings access. Backs the active campaign, Doctrine
/// preferences and any future single-value preference.
pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .optional()
    .map_err(|error| error.to_string())
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

/// The active campaign id (new missions attribute here). Falls back to the seeded
/// 'default' campaign if the setting is somehow absent.
pub fn active_campaign_id(conn: &Connection) -> Result<String, String> {
    Ok(get_setting(conn, "active_campaign_id")?.unwrap_or_else(|| "default".to_string()))
}

pub fn set_active_campaign(conn: &Connection, id: &str) -> Result<(), String> {
    set_setting(conn, "active_campaign_id", id)
}

pub fn create_campaign(conn: &Connection, id: &str, name: &str, now_ms: i64) -> Result<(), String> {
    conn.execute(
        "INSERT INTO campaigns (id, name, status, created_at) VALUES (?1, ?2, 'active', ?3)",
        params![id, name, now_ms.to_string()],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn list_campaigns(conn: &Connection) -> Result<Vec<Campaign>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, status FROM campaigns ORDER BY created_at ASC, name ASC")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Campaign {
                id: row.get(0)?,
                name: row.get(1)?,
                status: row.get(2)?,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn campaign_snapshot(conn: &Connection) -> Result<CampaignSnapshot, String> {
    Ok(CampaignSnapshot {
        campaigns: list_campaigns(conn)?,
        active_id: active_campaign_id(conn)?,
    })
}

/// User-configurable work and recovery rules. v0.2.0 covers break lengths.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Doctrine {
    pub short_break_minutes: i64,
    pub long_break_minutes: i64,
}

fn minutes_setting(conn: &Connection, key: &str, default: i64) -> Result<i64, String> {
    Ok(get_setting(conn, key)?
        .and_then(|value| value.parse::<i64>().ok())
        .filter(|minutes| *minutes >= 1)
        .unwrap_or(default))
}

pub fn doctrine_get(conn: &Connection) -> Result<Doctrine, String> {
    Ok(Doctrine {
        short_break_minutes: minutes_setting(conn, "short_break_minutes", 5)?,
        long_break_minutes: minutes_setting(conn, "long_break_minutes", 15)?,
    })
}

/// Persist break lengths, clamped to a sane range, and return the stored Doctrine.
pub fn doctrine_set(conn: &Connection, short: i64, long: i64) -> Result<Doctrine, String> {
    let short = short.clamp(1, 120);
    let long = long.clamp(1, 120);
    set_setting(conn, "short_break_minutes", &short.to_string())?;
    set_setting(conn, "long_break_minutes", &long.to_string())?;
    doctrine_get(conn)
}

/// Companion window preferences. side is "left"/"right"; scale and opacity are
/// clamped to safe ranges so the companion can never become invisible or huge.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanionPrefs {
    pub side: String,
    pub scale: f64,
    pub opacity: f64,
}

fn normalize_side(side: &str) -> &'static str {
    if side == "left" {
        "left"
    } else {
        "right"
    }
}

pub fn companion_prefs_get(conn: &Connection) -> Result<CompanionPrefs, String> {
    let side = normalize_side(
        &get_setting(conn, "companion_side")?.unwrap_or_else(|| "right".to_string()),
    )
    .to_string();
    let scale = get_setting(conn, "companion_scale")?
        .and_then(|value| value.parse::<f64>().ok())
        .unwrap_or(1.0)
        .clamp(0.5, 2.0);
    let opacity = get_setting(conn, "companion_opacity")?
        .and_then(|value| value.parse::<f64>().ok())
        .unwrap_or(1.0)
        .clamp(0.3, 1.0);
    Ok(CompanionPrefs {
        side,
        scale,
        opacity,
    })
}

pub fn companion_prefs_set(
    conn: &Connection,
    side: &str,
    scale: f64,
    opacity: f64,
) -> Result<CompanionPrefs, String> {
    set_setting(conn, "companion_side", normalize_side(side))?;
    set_setting(conn, "companion_scale", &scale.clamp(0.5, 2.0).to_string())?;
    set_setting(
        conn,
        "companion_opacity",
        &opacity.clamp(0.3, 1.0).to_string(),
    )?;
    companion_prefs_get(conn)
}

/// Whether closing the main window should hide it to the tray instead of quitting.
/// Off by default (closing quits), opt-in from the tray menu.
pub fn close_to_tray(conn: &Connection) -> Result<bool, String> {
    Ok(get_setting(conn, "close_to_tray")?
        .map(|value| value == "true")
        .unwrap_or(false))
}

/// Recovery Days: dates (YYYY-MM-DD) the user marked as planned rest. Stored as a
/// JSON array in settings so they persist, recover and travel in the export bundle.
pub fn recovery_days(conn: &Connection) -> Result<Vec<String>, String> {
    Ok(get_setting(conn, "recovery_days")?
        .and_then(|value| serde_json::from_str::<Vec<String>>(&value).ok())
        .unwrap_or_default())
}

/// Toggle a date's recovery status; returns the updated list. Never forced — only
/// the user calls this.
pub fn toggle_recovery_day(conn: &Connection, date: &str) -> Result<Vec<String>, String> {
    let mut days = recovery_days(conn)?;
    if let Some(pos) = days.iter().position(|day| day == date) {
        days.remove(pos);
    } else {
        days.push(date.to_string());
    }
    let json = serde_json::to_string(&days).map_err(|error| error.to_string())?;
    set_setting(conn, "recovery_days", &json)?;
    Ok(days)
}

// ----- Local data export / import (VIGIL-022) -------------------------------

pub const EXPORT_VERSION: i64 = 1;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CampaignRow {
    pub id: String,
    pub name: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissionRow {
    pub id: String,
    pub title: String,
    pub victory_condition: Option<String>,
    pub status: String,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub campaign_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusSessionRow {
    pub id: String,
    pub mission_id: String,
    pub state: String,
    pub planned_duration_seconds: i64,
    pub focused_duration_seconds: i64,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub outcome: Option<String>,
    pub total_paused_ms: i64,
    pub pause_started_at_ms: Option<i64>,
    pub result: Option<String>,
    pub blocker: Option<String>,
    pub next_action: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingRow {
    pub key: String,
    pub value: String,
}

/// The full local dataset, shaped for a portable backup file.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportBundle {
    pub version: i64,
    pub campaigns: Vec<CampaignRow>,
    pub missions: Vec<MissionRow>,
    pub focus_sessions: Vec<FocusSessionRow>,
    pub settings: Vec<SettingRow>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub campaigns_added: i64,
    pub missions_added: i64,
    pub sessions_added: i64,
    pub settings_added: i64,
}

pub fn export_data(conn: &Connection) -> Result<ExportBundle, String> {
    let campaigns = conn
        .prepare("SELECT id, name, status, created_at FROM campaigns ORDER BY created_at ASC")
        .and_then(|mut stmt| {
            stmt.query_map([], |row| {
                Ok(CampaignRow {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    status: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()
        })
        .map_err(|error| error.to_string())?;

    let missions = conn
        .prepare(
            "SELECT id, title, victory_condition, status, created_at, completed_at, campaign_id
             FROM missions ORDER BY created_at ASC",
        )
        .and_then(|mut stmt| {
            stmt.query_map([], |row| {
                Ok(MissionRow {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    victory_condition: row.get(2)?,
                    status: row.get(3)?,
                    created_at: row.get(4)?,
                    completed_at: row.get(5)?,
                    campaign_id: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()
        })
        .map_err(|error| error.to_string())?;

    let focus_sessions = conn
        .prepare(
            "SELECT id, mission_id, state, planned_duration_seconds, focused_duration_seconds,
                    started_at, completed_at, outcome, total_paused_ms, pause_started_at_ms,
                    result, blocker, next_action
             FROM focus_sessions ORDER BY started_at ASC",
        )
        .and_then(|mut stmt| {
            stmt.query_map([], |row| {
                Ok(FocusSessionRow {
                    id: row.get(0)?,
                    mission_id: row.get(1)?,
                    state: row.get(2)?,
                    planned_duration_seconds: row.get(3)?,
                    focused_duration_seconds: row.get(4)?,
                    started_at: row.get(5)?,
                    completed_at: row.get(6)?,
                    outcome: row.get(7)?,
                    total_paused_ms: row.get(8)?,
                    pause_started_at_ms: row.get(9)?,
                    result: row.get(10)?,
                    blocker: row.get(11)?,
                    next_action: row.get(12)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()
        })
        .map_err(|error| error.to_string())?;

    let settings = conn
        .prepare("SELECT key, value FROM settings ORDER BY key ASC")
        .and_then(|mut stmt| {
            stmt.query_map([], |row| {
                Ok(SettingRow {
                    key: row.get(0)?,
                    value: row.get(1)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()
        })
        .map_err(|error| error.to_string())?;

    Ok(ExportBundle {
        version: EXPORT_VERSION,
        campaigns,
        missions,
        focus_sessions,
        settings,
    })
}

/// Merge a bundle into the database additively: existing rows (by primary key) are
/// never overwritten (INSERT OR IGNORE), so importing can only add. Runs in one
/// transaction — a malformed bundle rolls back entirely rather than half-importing.
pub fn import_data(conn: &Connection, bundle: &ExportBundle) -> Result<ImportSummary, String> {
    if bundle.version != EXPORT_VERSION {
        return Err(format!("unsupported export version {}", bundle.version));
    }
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let mut summary = ImportSummary {
        campaigns_added: 0,
        missions_added: 0,
        sessions_added: 0,
        settings_added: 0,
    };
    for c in &bundle.campaigns {
        summary.campaigns_added += tx
            .execute(
                "INSERT OR IGNORE INTO campaigns (id, name, status, created_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![c.id, c.name, c.status, c.created_at],
            )
            .map_err(|e| e.to_string())? as i64;
    }
    // Missions before sessions to satisfy the focus_sessions -> missions foreign key.
    for m in &bundle.missions {
        summary.missions_added += tx
            .execute(
                "INSERT OR IGNORE INTO missions
                    (id, title, victory_condition, status, created_at, completed_at, campaign_id)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    m.id,
                    m.title,
                    m.victory_condition,
                    m.status,
                    m.created_at,
                    m.completed_at,
                    m.campaign_id
                ],
            )
            .map_err(|e| e.to_string())? as i64;
    }
    for s in &bundle.focus_sessions {
        summary.sessions_added += tx
            .execute(
                "INSERT OR IGNORE INTO focus_sessions
                    (id, mission_id, state, planned_duration_seconds, focused_duration_seconds,
                     started_at, completed_at, outcome, total_paused_ms, pause_started_at_ms,
                     result, blocker, next_action)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    s.id,
                    s.mission_id,
                    s.state,
                    s.planned_duration_seconds,
                    s.focused_duration_seconds,
                    s.started_at,
                    s.completed_at,
                    s.outcome,
                    s.total_paused_ms,
                    s.pause_started_at_ms,
                    s.result,
                    s.blocker,
                    s.next_action
                ],
            )
            .map_err(|e| e.to_string())? as i64;
    }
    for st in &bundle.settings {
        summary.settings_added += tx
            .execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                params![st.key, st.value],
            )
            .map_err(|e| e.to_string())? as i64;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(summary)
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
        let rows: i64 = conn
            .query_row("SELECT count(*) FROM focus_sessions", [], |r| r.get(0))
            .unwrap();
        assert_eq!(rows, 0);
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
        let recent = recent_records(&conn, 10).unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].mission_title, "Ship slice");
        assert_eq!(recent[0].outcome, "completed");
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
        let recent = recent_records(&conn, 10).unwrap();
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
        assert_eq!(recent_records(&conn, 10).unwrap().len(), 1); // one record, not two
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
        assert_eq!(recent_records(&conn, 10).unwrap()[0].outcome, "completed");
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

    #[test]
    fn default_campaign_is_seeded_and_active() {
        let conn = db::open(":memory:").unwrap();
        let snap = campaign_snapshot(&conn).unwrap();
        assert_eq!(snap.active_id, "default");
        assert_eq!(snap.campaigns.len(), 1);
        assert_eq!(snap.campaigns[0].id, "default");
    }

    #[test]
    fn create_then_activate_a_campaign() {
        let conn = db::open(":memory:").unwrap();
        create_campaign(&conn, "c2", "Launch", 1_000).unwrap();
        set_active_campaign(&conn, "c2").unwrap();
        let snap = campaign_snapshot(&conn).unwrap();
        assert_eq!(snap.active_id, "c2");
        assert_eq!(snap.campaigns.len(), 2);
    }

    #[test]
    fn a_session_attributes_its_mission_to_the_active_campaign() {
        let conn = db::open(":memory:").unwrap();
        create_campaign(&conn, "c2", "Launch", 1_000).unwrap();
        set_active_campaign(&conn, "c2").unwrap();

        let mut s = focusing_session();
        s.complete().unwrap();
        record_session(&conn, &s, 90, 100_000).unwrap();

        let campaign_id: String = conn
            .query_row(
                "SELECT campaign_id FROM missions WHERE id = 'm1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(campaign_id, "c2");
    }

    #[test]
    fn switching_the_active_campaign_does_not_re_attribute_a_running_mission() {
        let conn = db::open(":memory:").unwrap();
        let s = focusing_session();
        record_session(&conn, &s, 60, 61_000).unwrap(); // lands under 'default'
        create_campaign(&conn, "c2", "Launch", 1_000).unwrap();
        set_active_campaign(&conn, "c2").unwrap();
        record_session(&conn, &s, 90, 91_000).unwrap(); // later update must not move it

        let campaign_id: String = conn
            .query_row(
                "SELECT campaign_id FROM missions WHERE id = 'm1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(campaign_id, "default");
    }

    #[test]
    fn doctrine_defaults_then_persists() {
        let conn = db::open(":memory:").unwrap();
        let d = doctrine_get(&conn).unwrap();
        assert_eq!(d.short_break_minutes, 5);
        assert_eq!(d.long_break_minutes, 15);

        let saved = doctrine_set(&conn, 3, 20).unwrap();
        assert_eq!(saved.short_break_minutes, 3);
        assert_eq!(saved.long_break_minutes, 20);
        assert_eq!(doctrine_get(&conn).unwrap().short_break_minutes, 3);
    }

    #[test]
    fn doctrine_clamps_out_of_range_values() {
        let conn = db::open(":memory:").unwrap();
        let saved = doctrine_set(&conn, 0, 999).unwrap();
        assert_eq!(saved.short_break_minutes, 1);
        assert_eq!(saved.long_break_minutes, 120);
    }

    #[test]
    fn doctrine_survives_reopening_the_database() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("vigil.db");
        let path_str = path.to_str().unwrap();
        {
            let conn = db::open(path_str).unwrap();
            doctrine_set(&conn, 7, 30).unwrap();
        }
        let conn = db::open(path_str).unwrap();
        let d = doctrine_get(&conn).unwrap();
        assert_eq!(d.short_break_minutes, 7);
        assert_eq!(d.long_break_minutes, 30);
    }

    #[test]
    fn export_then_import_into_a_fresh_db_preserves_records() {
        let src = db::open(":memory:").unwrap();
        create_campaign(&src, "c2", "Launch", 1_000).unwrap();
        set_active_campaign(&src, "c2").unwrap();
        doctrine_set(&src, 7, 30).unwrap();
        let mut s = focusing_session();
        s.complete().unwrap();
        record_session(&src, &s, 90, 100_000).unwrap();
        save_debrief(&src, "s1", "done", "", "next").unwrap();

        let bundle = export_data(&src).unwrap();

        let dst = db::open(":memory:").unwrap();
        let summary = import_data(&dst, &bundle).unwrap();
        assert!(summary.missions_added >= 1);
        assert_eq!(summary.sessions_added, 1);

        // The finished session, its campaign attribution and its debrief survive.
        let recent = recent_records(&dst, 10).unwrap();
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].id, "s1");
        let campaign_id: String = dst
            .query_row(
                "SELECT campaign_id FROM missions WHERE id = 'm1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(campaign_id, "c2");
        let result: Option<String> = dst
            .query_row(
                "SELECT result FROM focus_sessions WHERE id = 's1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(result.as_deref(), Some("done"));
        assert_eq!(doctrine_get(&dst).unwrap().short_break_minutes, 7);
    }

    #[test]
    fn import_merges_without_overwriting_existing_rows() {
        let dst = db::open(":memory:").unwrap();
        let mut s = focusing_session();
        s.complete().unwrap();
        record_session(&dst, &s, 60, 61_000).unwrap(); // s1 focused=60 already here

        let bundle = ExportBundle {
            version: EXPORT_VERSION,
            campaigns: vec![],
            missions: vec![MissionRow {
                id: "m1".into(),
                title: "changed".into(),
                victory_condition: None,
                status: "closed".into(),
                created_at: "0".into(),
                completed_at: None,
                campaign_id: Some("default".into()),
            }],
            focus_sessions: vec![FocusSessionRow {
                id: "s1".into(),
                mission_id: "m1".into(),
                state: "complete".into(),
                planned_duration_seconds: 1,
                focused_duration_seconds: 1, // would clobber 60 if overwriting
                started_at: "0".into(),
                completed_at: Some("1".into()),
                outcome: Some("completed".into()),
                total_paused_ms: 0,
                pause_started_at_ms: None,
                result: None,
                blocker: None,
                next_action: None,
            }],
            settings: vec![],
        };
        let summary = import_data(&dst, &bundle).unwrap();
        assert_eq!(summary.sessions_added, 0); // s1 already present -> ignored

        let focused: i64 = dst
            .query_row(
                "SELECT focused_duration_seconds FROM focus_sessions WHERE id = 's1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(focused, 60); // existing data untouched
    }

    #[test]
    fn import_rejects_an_unsupported_version() {
        let dst = db::open(":memory:").unwrap();
        let bundle = ExportBundle {
            version: 999,
            campaigns: vec![],
            missions: vec![],
            focus_sessions: vec![],
            settings: vec![],
        };
        assert!(import_data(&dst, &bundle).is_err());
    }

    #[test]
    fn companion_prefs_default_then_persist_and_clamp() {
        let conn = db::open(":memory:").unwrap();
        let d = companion_prefs_get(&conn).unwrap();
        assert_eq!(d.side, "right");
        assert_eq!(d.scale, 1.0);
        assert_eq!(d.opacity, 1.0);

        let saved = companion_prefs_set(&conn, "left", 5.0, 0.0).unwrap();
        assert_eq!(saved.side, "left");
        assert_eq!(saved.scale, 2.0); // clamped from 5.0
        assert_eq!(saved.opacity, 0.3); // clamped from 0.0
                                        // Recovers on a fresh read.
        let reread = companion_prefs_get(&conn).unwrap();
        assert_eq!(reread.side, "left");
        assert_eq!(reread.scale, 2.0);
        assert_eq!(reread.opacity, 0.3);

        // An unknown side normalizes to the default.
        assert_eq!(
            companion_prefs_set(&conn, "up", 1.0, 1.0).unwrap().side,
            "right"
        );
    }

    #[test]
    fn close_to_tray_defaults_off_and_toggles() {
        let conn = db::open(":memory:").unwrap();
        assert!(!close_to_tray(&conn).unwrap());
        set_setting(&conn, "close_to_tray", "true").unwrap();
        assert!(close_to_tray(&conn).unwrap());
        set_setting(&conn, "close_to_tray", "false").unwrap();
        assert!(!close_to_tray(&conn).unwrap());
    }

    #[test]
    fn recovery_days_toggle_on_and_off_and_persist() {
        let conn = db::open(":memory:").unwrap();
        assert!(recovery_days(&conn).unwrap().is_empty());
        assert_eq!(
            toggle_recovery_day(&conn, "2026-07-18").unwrap(),
            vec!["2026-07-18"]
        );
        // Persisted read.
        assert_eq!(recovery_days(&conn).unwrap(), vec!["2026-07-18"]);
        // A second date accumulates.
        assert_eq!(
            toggle_recovery_day(&conn, "2026-07-19").unwrap(),
            vec!["2026-07-18", "2026-07-19"]
        );
        // Toggling off removes just that date.
        assert_eq!(
            toggle_recovery_day(&conn, "2026-07-18").unwrap(),
            vec!["2026-07-19"]
        );
    }
}
