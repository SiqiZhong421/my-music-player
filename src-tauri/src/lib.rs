use std::fs;
use std::path::Path;
use tauri::Manager;

mod metadata;
mod scanner;

use metadata::{read_metadata, TrackMetadata};
use scanner::scan_folder;

#[tauri::command]
async fn scan_music_folder(path: String) -> Result<Vec<TrackMetadata>, String> {
    scan_folder(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_track_metadata(path: String) -> Result<TrackMetadata, String> {
    read_metadata(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn copy_track_to_app_dir(
    app_handle: tauri::AppHandle,
    source_path: String,
) -> Result<String, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let tracks_dir = data_dir.join("tracks");
    fs::create_dir_all(&tracks_dir).map_err(|e| e.to_string())?;

    let file_name = Path::new(&source_path)
        .file_name()
        .ok_or("Invalid path")?;
    let dest_path = tracks_dir.join(file_name);

    if dest_path.exists() {
        return Ok(dest_path.to_string_lossy().to_string());
    }

    fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;
    Ok(dest_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_music_folder,
            get_track_metadata,
            copy_track_to_app_dir
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
