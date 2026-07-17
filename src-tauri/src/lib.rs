use tauri::Manager;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            show_companion,
            hide_companion,
            set_companion_click_through,
            minimize_main,
            toggle_maximize_main,
            close_main
        ])
        .run(tauri::generate_context!())
        .expect("error while running VIGIL");
}
