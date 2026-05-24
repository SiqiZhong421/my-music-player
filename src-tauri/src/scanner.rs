use std::path::Path;
use walkdir::WalkDir;

use crate::metadata::{read_metadata, TrackMetadata};

const AUDIO_EXTENSIONS: [&str; 6] = ["mp3", "flac", "m4a", "wav", "ogg", "aac"];

pub fn scan_folder(path: &str) -> Result<Vec<TrackMetadata>, Box<dyn std::error::Error>> {
    let mut tracks = Vec::new();

    for entry in WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() && is_audio_file(path) {
            match read_metadata(path.to_str().unwrap_or("")) {
                Ok(metadata) => tracks.push(metadata),
                Err(_) => continue,
            }
        }
    }

    // Sort by album artist then album then track number
    tracks.sort_by(|a, b| {
        a.artist
            .as_ref()
            .unwrap_or(&"Unknown Artist".to_string())
            .cmp(b.artist.as_ref().unwrap_or(&"Unknown Artist".to_string()))
            .then_with(|| {
                a.album
                    .as_ref()
                    .unwrap_or(&"Unknown Album".to_string())
                    .cmp(b.album.as_ref().unwrap_or(&"Unknown Album".to_string()))
            })
            .then_with(|| a.track_number.unwrap_or(0).cmp(&b.track_number.unwrap_or(0)))
    });

    Ok(tracks)
}

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}
