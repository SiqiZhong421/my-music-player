use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
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

#[tauri::command]
async fn import_folder_to_library(
    app_handle: tauri::AppHandle,
    source_path: String,
) -> Result<Vec<TrackMetadata>, String> {
    let tracks = scan_folder(&source_path).map_err(|e| e.to_string())?;

    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let tracks_dir = data_dir.join("tracks");

    // Clear and recreate tracks directory
    if tracks_dir.exists() {
        fs::remove_dir_all(&tracks_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&tracks_dir).map_err(|e| e.to_string())?;

    let mut updated_tracks = Vec::new();

    for mut track in tracks {
        let source = Path::new(&track.path);
        let file_name = match source.file_name() {
            Some(name) => name.to_string_lossy().to_string(),
            None => continue,
        };
        let mut dest_path = tracks_dir.join(&file_name);

        // Handle filename collisions by appending a hash
        if dest_path.exists() {
            let mut hasher = DefaultHasher::new();
            track.path.hash(&mut hasher);
            let hash = format!("{:x}", hasher.finish());
            let stem = Path::new(&file_name)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown");
            let ext = Path::new(&file_name)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("mp3");
            dest_path = tracks_dir.join(format!("{}_{}.{}", stem, hash, ext));
        }

        // Copy audio file
        if let Err(e) = fs::copy(&source, &dest_path) {
            eprintln!("Failed to copy {}: {}", source.display(), e);
            continue;
        }

        // Copy sidecar .lrc file if it exists
        let lrc_source = source.with_extension("lrc");
        if lrc_source.exists() {
            let lrc_dest = dest_path.with_extension("lrc");
            let _ = fs::copy(&lrc_source, &lrc_dest);
        }

        track.path = dest_path.to_string_lossy().to_string();
        updated_tracks.push(track);
    }

    // Save metadata cache
    let cache_path = tracks_dir.join("library.json");
    if let Ok(json) = serde_json::to_string(&updated_tracks) {
        let _ = fs::write(&cache_path, &json);
    }

    Ok(updated_tracks)
}

#[tauri::command]
async fn load_library(app_handle: tauri::AppHandle) -> Result<Vec<TrackMetadata>, String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let tracks_dir = data_dir.join("tracks");
    let cache_path = tracks_dir.join("library.json");

    // Try reading cache first (fast path)
    if cache_path.exists() {
        match fs::read_to_string(&cache_path) {
            Ok(content) if !content.is_empty() => {
                if let Ok(tracks) = serde_json::from_str::<Vec<TrackMetadata>>(&content) {
                    let valid: Vec<TrackMetadata> = tracks
                        .into_iter()
                        .filter(|t| Path::new(&t.path).exists())
                        .collect();
                    if !valid.is_empty() {
                        return Ok(valid);
                    }
                }
            }
            _ => {}
        }
    }

    // Fallback: scan the tracks directory
    if tracks_dir.exists() {
        let tracks = scan_folder(&tracks_dir.to_string_lossy()).map_err(|e| e.to_string())?;
        // Save cache for next startup
        if !tracks.is_empty() {
            if let Ok(json) = serde_json::to_string(&tracks) {
                let _ = fs::write(&cache_path, &json);
            }
        }
        return Ok(tracks);
    }

    Ok(Vec::new())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_music_folder,
            get_track_metadata,
            copy_track_to_app_dir,
            import_folder_to_library,
            load_library
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
