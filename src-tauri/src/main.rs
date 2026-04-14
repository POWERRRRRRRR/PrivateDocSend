#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod active_window;
mod clipboard_bridge;
mod editor_automation;

#[tauri::command]
fn get_editor_context() -> active_window::WindowInfo {
    active_window::current_editor_context()
}

#[tauri::command]
fn replace_all_in_active_editor(
    find_text: String,
    replace_text: String,
) -> Result<editor_automation::AutomationResponse, String> {
    editor_automation::replace_all_in_active_editor(&find_text, &replace_text)
}

#[tauri::command]
fn restore_all_in_active_editor(
    mapping: Vec<editor_automation::MappingEntryInput>,
) -> Result<editor_automation::AutomationResponse, String> {
    editor_automation::restore_all_in_active_editor(mapping)
}

fn main() {
    tauri::Builder::default()
        .setup(|_| {
            active_window::start_foreground_tracker();
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_editor_context,
            replace_all_in_active_editor,
            restore_all_in_active_editor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
