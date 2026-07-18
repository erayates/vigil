pub mod db;
pub mod repository;
mod session;

use rusqlite::Connection;
use session::{SessionSnapshot, SessionState};
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
            session_reset
        ])
        .run(tauri::generate_context!())
        .expect("error while running VIGIL");
}
