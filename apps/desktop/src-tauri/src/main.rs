mod backup;
mod commands;
mod fs;
mod validation;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_runtime_context,
            commands::read_candidate_files,
            commands::write_permission_file,
            commands::list_backups,
            commands::read_text_file,
            commands::open_in_finder
        ])
        .run(tauri::generate_context!())
        .expect("failed to run app");
}

fn main() {
    run();
}
