pub mod db;
pub mod repository;
mod session;
pub mod window;

use rusqlite::Connection;
use session::{Phase, SessionSnapshot, SessionState};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::menu::{CheckMenuItem, Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt as _};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;
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
    // One native notification on completion; a denied OS permission just fails here.
    let _ = app
        .notification()
        .builder()
        .title("Watch complete")
        .body("Hold the line — record your debrief.")
        .show();
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

/// START_BREAK — begin an optional recovery break of `planned_duration_secs`.
/// A break carries no mission and is not persisted, so no `persist` call here.
#[tauri::command]
fn session_start_break(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
    planned_duration_secs: u64,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .start_break(now, planned_duration_secs)
            .map_err(|_| "invalid transition".to_string())?;
        session.snapshot(now)
    };
    broadcast(&app, &snapshot);
    Ok(snapshot)
}

#[tauri::command]
fn session_end_break(
    app: tauri::AppHandle,
    state: tauri::State<'_, Mutex<SessionState>>,
) -> Result<SessionSnapshot, String> {
    let now = now_ms();
    let snapshot = {
        let mut session = state.lock().unwrap();
        session
            .end_break()
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

#[tauri::command]
fn doctrine_get(db: tauri::State<'_, Mutex<Connection>>) -> Result<repository::Doctrine, String> {
    let conn = db.lock().unwrap();
    repository::doctrine_get(&conn)
}

#[tauri::command]
fn doctrine_set(
    db: tauri::State<'_, Mutex<Connection>>,
    short_break_minutes: i64,
    long_break_minutes: i64,
) -> Result<repository::Doctrine, String> {
    let conn = db.lock().unwrap();
    repository::doctrine_set(&conn, short_break_minutes, long_break_minutes)
}

/// Serialize the whole local dataset to a JSON string for a user-saved backup.
#[tauri::command]
fn data_export(db: tauri::State<'_, Mutex<Connection>>) -> Result<String, String> {
    let conn = db.lock().unwrap();
    let bundle = repository::export_data(&conn)?;
    serde_json::to_string_pretty(&bundle).map_err(|error| error.to_string())
}

/// Validate a backup JSON and merge it additively (never overwrites existing rows).
#[tauri::command]
fn data_import(
    db: tauri::State<'_, Mutex<Connection>>,
    json: String,
) -> Result<repository::ImportSummary, String> {
    let bundle: repository::ExportBundle =
        serde_json::from_str(&json).map_err(|error| format!("invalid backup file: {error}"))?;
    let conn = db.lock().unwrap();
    repository::import_data(&conn, &bundle)
}

/// Move the companion to the left or right edge of the primary monitor. Runtime
/// window placement — best-effort, silently ignored if the window/monitor is gone.
fn apply_companion_side(app: &tauri::AppHandle, side: &str) {
    let Some(companion) = app.get_webview_window("companion") else {
        return;
    };
    let (Ok(size), Ok(Some(monitor))) = (companion.outer_size(), companion.primary_monitor())
    else {
        return;
    };
    let mpos = monitor.position();
    let msize = monitor.size();
    let margin = 24_i32;
    let x = if side == "left" {
        mpos.x + margin
    } else {
        mpos.x + msize.width as i32 - size.width as i32 - margin
    };
    let _ = companion.set_position(tauri::PhysicalPosition::new(x, mpos.y + margin));
}

#[tauri::command]
fn companion_prefs_get(
    db: tauri::State<'_, Mutex<Connection>>,
) -> Result<repository::CompanionPrefs, String> {
    let conn = db.lock().unwrap();
    repository::companion_prefs_get(&conn)
}

/// Persist companion preferences, reposition for the chosen side, and broadcast so
/// the companion window applies scale/opacity live (no restart).
#[tauri::command]
fn companion_prefs_set(
    app: tauri::AppHandle,
    db: tauri::State<'_, Mutex<Connection>>,
    side: String,
    scale: f64,
    opacity: f64,
) -> Result<repository::CompanionPrefs, String> {
    let prefs = {
        let conn = db.lock().unwrap();
        repository::companion_prefs_set(&conn, &side, scale, opacity)?
    };
    apply_companion_side(&app, &prefs.side);
    let _ = app.emit("companion://prefs", &prefs);
    Ok(prefs)
}

/// Bring the companion back and re-enable mouse interaction, and surface the main
/// window. Shared by the tray and the global shortcut (VIGIL-009 recovery path).
fn recover_companion(app: &tauri::AppHandle) {
    if let Some(companion) = app.get_webview_window("companion") {
        let _ = companion.show();
        let _ = companion.set_ignore_cursor_events(false);
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
}

/// Build the system tray: show/hide the companion (disabling click-through on
/// show, which closes VIGIL-009's deferred recovery path), open the main window,
/// toggle close-to-tray, and quit. Backend-created, so no extra capability.
fn setup_tray(app: &tauri::AppHandle, close_to_tray_enabled: bool) -> tauri::Result<()> {
    let show_companion_i = MenuItem::with_id(
        app,
        "tray_show_companion",
        "Show companion",
        true,
        None::<&str>,
    )?;
    let hide_companion_i = MenuItem::with_id(
        app,
        "tray_hide_companion",
        "Hide companion",
        true,
        None::<&str>,
    )?;
    let open_main_i = MenuItem::with_id(app, "tray_open_main", "Open VIGIL", true, None::<&str>)?;
    let close_to_tray_i = CheckMenuItem::with_id(
        app,
        "tray_close_to_tray",
        "Close to tray",
        true,
        close_to_tray_enabled,
        None::<&str>,
    )?;
    let autostart_i = CheckMenuItem::with_id(
        app,
        "tray_autostart",
        "Launch at login",
        true,
        app.autolaunch().is_enabled().unwrap_or(false),
        None::<&str>,
    )?;
    let quit_i = MenuItem::with_id(app, "tray_quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &show_companion_i,
            &hide_companion_i,
            &open_main_i,
            &close_to_tray_i,
            &autostart_i,
            &quit_i,
        ],
    )?;

    let Some(icon) = app.default_window_icon().cloned() else {
        // Without an icon the tray can't render; the main-window "Recall companion"
        // control (VIGIL-009) stays as the recovery path.
        eprintln!("[vigil] no window icon available; skipping tray");
        return Ok(());
    };

    TrayIconBuilder::with_id("vigil-tray")
        .icon(icon)
        .tooltip("VIGIL")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "tray_show_companion" => {
                if let Some(window) = app.get_webview_window("companion") {
                    let _ = window.show();
                    let _ = window.set_ignore_cursor_events(false);
                }
            }
            "tray_hide_companion" => {
                if let Some(window) = app.get_webview_window("companion") {
                    let _ = window.hide();
                }
            }
            "tray_open_main" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "tray_close_to_tray" => {
                let state = app.state::<Mutex<Connection>>();
                let conn = state.lock().unwrap();
                let next = !repository::close_to_tray(&conn).unwrap_or(false);
                let _ = repository::set_setting(
                    &conn,
                    "close_to_tray",
                    if next { "true" } else { "false" },
                );
                let _ = close_to_tray_i.set_checked(next);
            }
            "tray_autostart" => {
                let manager = app.autolaunch();
                let next = !manager.is_enabled().unwrap_or(false);
                let result = if next {
                    manager.enable()
                } else {
                    manager.disable()
                };
                if result.is_ok() {
                    let _ = autostart_i.set_checked(next);
                }
            }
            "tray_quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;
    Ok(())
}

#[tauri::command]
fn recovery_days_get(db: tauri::State<'_, Mutex<Connection>>) -> Result<Vec<String>, String> {
    let conn = db.lock().unwrap();
    repository::recovery_days(&conn)
}

#[tauri::command]
fn recovery_day_toggle(
    db: tauri::State<'_, Mutex<Connection>>,
    date: String,
) -> Result<Vec<String>, String> {
    let conn = db.lock().unwrap();
    repository::toggle_recovery_day(&conn, &date)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        recover_companion(app);
                    }
                })
                .build(),
        )
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
            let close_to_tray_enabled = repository::close_to_tray(&connection).unwrap_or(false);
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

            setup_tray(app.handle(), close_to_tray_enabled)?;

            // Global recovery shortcut (Ctrl+Shift+V): bring back the companion and
            // main window from anywhere. Best-effort — a conflict is logged, not fatal.
            let recover_shortcut =
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyV);
            if let Err(error) = app.global_shortcut().register(recover_shortcut) {
                eprintln!("[vigil] could not register recovery shortcut: {error}");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the main window hides it to the tray when the preference is on;
            // otherwise the default close (quit) proceeds.
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    let keep = {
                        let state = window.app_handle().state::<Mutex<Connection>>();
                        let conn = state.lock().unwrap();
                        repository::close_to_tray(&conn).unwrap_or(false)
                    };
                    if keep {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
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
            session_start_break,
            session_end_break,
            campaign_get,
            campaign_create,
            campaign_set_active,
            doctrine_get,
            doctrine_set,
            data_export,
            data_import,
            companion_prefs_get,
            companion_prefs_set,
            recovery_days_get,
            recovery_day_toggle
        ])
        .run(tauri::generate_context!())
        .expect("error while running VIGIL");
}
