use lofty::file::{AudioFile, TaggedFileExt};
use lofty::tag::ItemKey;
use std::fs;
use std::path::Path;
use base64::{Engine as _, engine::general_purpose};

#[derive(serde::Serialize, Clone, Debug)]
pub struct TrackMetadata {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,
    pub genre: Option<String>,
    pub year: Option<u32>,
    pub track_number: Option<u32>,
    pub duration: Option<f64>,
    pub cover_art: Option<String>, // base64 encoded
    pub lyrics: Option<String>,
    pub file_name: String,
}

pub fn read_metadata(path: &str) -> Result<TrackMetadata, Box<dyn std::error::Error>> {
    let path_obj = Path::new(path);
    let file_name = path_obj
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let tagged_file = lofty::read_from_path(path)?;

    let tag = match tagged_file.primary_tag() {
        Some(tag) => tag,
        None => tagged_file.first_tag().ok_or("No tags found")?,
    };

    let title = tag.get_string(&ItemKey::TrackTitle).map(|s| s.to_string());
    let artist = tag.get_string(&ItemKey::TrackArtist).map(|s| s.to_string());
    let album = tag.get_string(&ItemKey::AlbumTitle).map(|s| s.to_string());
    let album_artist = tag.get_string(&ItemKey::AlbumArtist).map(|s| s.to_string());
    let genre = tag.get_string(&ItemKey::Genre).map(|s| s.to_string());
    let year = tag.get_string(&ItemKey::Year).and_then(|s| s.parse::<u32>().ok());
    let track_number = tag
        .get_string(&ItemKey::TrackNumber)
        .and_then(|s| s.split('/').next()?.parse::<u32>().ok());
    let sidecar_lyrics = read_sidecar_lrc(path_obj);
    let embedded_lyrics = tag.get_string(&ItemKey::Lyrics).map(|s| s.to_string());
    let lyrics = sidecar_lyrics.or(embedded_lyrics);

    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs_f64().into();

    // Read cover art
    let cover_art = tag
        .pictures()
        .first()
        .map(|pic| general_purpose::STANDARD.encode(pic.data()));

    Ok(TrackMetadata {
        path: path.to_string(),
        title,
        artist,
        album,
        album_artist,
        genre,
        year,
        track_number,
        duration,
        cover_art,
        lyrics,
        file_name,
    })
}

fn read_sidecar_lrc(path: &Path) -> Option<String> {
    let lrc_path = path.with_extension("lrc");
    let bytes = fs::read(lrc_path).ok()?;
    Some(String::from_utf8_lossy(&bytes).trim_start_matches('\u{feff}').to_string())
}
