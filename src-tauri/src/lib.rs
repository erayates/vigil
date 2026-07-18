pub mod db;
pub mod repository;
mod session;
pub mod window;

use rusqlite::Connection;
use session::{Phase, SessionSnapshot, SessionState};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};
use uuid::Uuid;

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

fn broadcast(app: &tauri::AppHandle, snapshot: &SessionSnapshot) {
    let _ = app.emit("session://changed", snapshot);
}

/// Mirror the authoritative session into SQLite (best-effort). The in-memory
/// state stays authoritative even if a write fails.
fn persist(db: &tauri::State<'_, Mutex<Connection>>, session: &SessionState, now_ms: i64) {
    let focused = session.focused_secs(now_ms);
    let conn = db.lock().unwrap();
    if let Err(error) = repository::record_session(&conn, session, focused, now_ms) {
        eprintln!("[vigil] session persist failed: {error}");
    }
}

fn webview_window(app: &tauri::AppHandle, label: &str) -> Result<tauri::WebviewWindow, String> {
    app.get_webview_window(label)
        .ok_or_else(|| format!("Window '{label}' was not created"))
}

#[tauri::command]
fn show_companion(app: tauri::AppHandle) -> Result<(), String> {
    webview_window(&app, "companion")?
        .show()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_companion(app: tauri::AppHandle) -> Result<(), String> {
    webview_window(&app, "companion")?
        .hide()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_companion_click_through(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    webview_window(&app, "companion")?
        .set_ignore_cursor_events(enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn minimize_main(app: tauri::AppHandle) -> Result<(), String> {
    webview_window(&app, "main")?
        .minimize()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn toggle_maximize_main(app: tauri::AppHandle) -> Result<(), String> {
    let window = webview_window(&app, "main")?;
    let maximized = window.is_maximized().map_err(|error| error.to_string())?;
    if maximized {
        window.unmaximize().map_err(|error| error.to_string())
    } else {
        window.maximize().map_err(|error| error.to_string())
    }
}

#[tauri::command]
fn close_main(app: tauri::AppHandle) -> Result<(), String> {
    webview_window(&app, "main")?
        .close()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn session_get(state: tauri::State<'_, Mutex<SessionState>>) -> SessionSnapshot {
    state.lock().unwrap().snapshot(now_ms())
}

#[tauri::command]
fn session_start(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    mission_title: String,
    victory_condition: String,
    planned_duration_secs: u64,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .start(
                Uuid::new_v4().to_string(),
                Uuid::new_v4().to_string(),
                mission_title,
                victory_condition,
                planned_duration_secs,
            )
            .map_err(|_| "invalid transition".to_string())?;
        // Preparing has no started_at yet; the durable row appears at `begin`.
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_begin(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .begin(now)
            .map_err(|_| "invalid transition".to_string())?;
        persist(&db, &session, now);
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_cancel(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .cancel()
            .map_err(|_| "invalid transition".to_string())?;
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_pause(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .pause(now)
            .map_err(|_| "invalid transition".to_string())?;
        persist(&db, &session, now);
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_resume(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .resume(now)
            .map_err(|_| "invalid transition".to_string())?;
        persist(&db, &session, now);
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_complete(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .complete()
            .map_err(|_| "invalid transition".to_string())?;
        persist(&db, &session, now);
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_abandon(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .abandon()
            .map_err(|_| "invalid transition".to_string())?;
        persist(&db, &session, now);
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_reset(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
) -> SessionSnapshot {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session.reset();
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    snapshot
}

/// OPEN_DEBRIEF — enter the optional debrief after a watch ends. The finished row
/// is already persisted; this only changes phase, so it must not call `persist`
/// (which would overwrite the terminal state/outcome with a non-terminal one).
#[tauri::command]
fn session_open_debrief(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .open_debrief()
            .map_err(|_| "invalid transition".to_string())?;
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

/// RECORD — attach the debrief to the finished row, then return to Idle. Blank
/// fields are stored as NULL by the repository.
#[tauri::command]
fn session_record(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    db: tauri::State<'_, Mutex<Connection>>,
    result: String,
    blocker: String,
    next_action: String,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        if session.phase != Phase::Debrief {
            return Err("invalid transition".to_string());
        }
        let id = session.id.clone().ok_or("no session to debrief")?;
        {
            let conn = db.lock().unwrap();
            repository::save_debrief(&conn, &id, &result, &blocker, &next_action)?;
        }
        session
            .record()
            .map_err(|_| "invalid transition".to_string())?;
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_history(
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<Vec<repository::HistoryRecord>, String> {
    let conn = db.lock().unwrap();
    repository::recent_records(&conn, 50)
}

#[tauri::command]
fn campaign_get(
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<repository::CampaignSnapshot, String> {
    let conn = db.lock().unwrap();
    repository::campaign_snapshot(&conn)
}

/// Create a campaign and make it active (new missions attribute to it).
#[tauri::command]
fn campaign_create(
    db: tauri::State<'_, Mutex<Connection>>,
    name: String,
) -> Result<repository::CampaignSnapshot, String> {
    let conn = db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    repository::create_campaign(&conn, &id, &name, now_ms())?;
    repository::set_active_campaign(&conn, &id)?;
    repository::campaign_snapshot(&conn)
}

#[tauri::command]
fn campaign_set_active(
    db: tauri::State<'_, Mutex<Connection>>,
    id: String,
) -> Result<repository::CampaignSnapshot, String> {
    let conn = db.lock().unwrap();
    repository::set_active_campaign(&conn, &id)?;
    repository::campaign_snapshot(&conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(SessionState::idle()))
        .setup(|app| {
            let mut path = app.path().app_data_dir()?;
            std::fs::create_dir_all(&path)?;
            path.push("vigil.db");
            let db_path = path.to_str().ok_or("database path is not valid UTF-8")?;
            let connection = db::open(db_path)?;
            // Recover an active session left by a previous run (forced quit / crash).
            if let Some(recovered) = repository::active_session(&connection)? {
                *app.state::<Mutex<SessionState>>().lock().unwrap() = recovered;
            }
            app.manage(Mutex::new(connection));

            // Keep the companion reachable if a monitor was unplugged since last run.
            if let Some(companion) = app.get_webview_window("companion") {
                if let (Ok(pos), Ok(size), Ok(monitors)) = (
                    companion.outer_position(),
                    companion.outer_size(),
                    companion.available_monitors(),
                ) {
                    let areas: Vec<window::WorkArea> = monitors
                        .iter()
                        .map(|monitor| {
                            let p = monitor.position();
                            let s = monitor.size();
                            window::WorkArea {
                                x: p.x,
                                y: p.y,
                                width: s.width as i32,
                                height: s.height as i32,
                            }
                        })
                        .collect();
                    let (nx, ny) = window::clamp_to_work_areas(
                        pos.x,
                        pos.y,
                        size.width as i32,
                        size.height as i32,
                        &areas,
                    );
                    if (nx, ny) != (pos.x, pos.y) {
                        let _ = companion.set_position(tauri::PhysicalPosition::new(nx, ny));
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_companion,
            hide_companion,
            set_companion_click_through,
            minimize_main,
            toggle_maximize_main,
            close_main,
            session_get,
            session_start,
            session_begin,
            session_cancel,
            session_abandon,
            session_pause,
            session_resume,
            session_complete,
            session_reset,
            session_open_debrief,
            session_record,
            session_history,
            campaign_get,
            campaign_create,
            campaign_set_active
        ])
        .run(tauri::generate_context!())
        .expect("error while running VIGIL");
}
