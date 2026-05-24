import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import { localizeTrackTitle } from "@/utils/trackTitles";
import type { Track } from "@/types";

const LAST_LIBRARY_FOLDER_KEY = "music-player:last-library-folder";
let hasRestoredLastFolder = false;

interface RawTrackMetadata {
  path: string;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  album_artist?: string | null;
  genre?: string | null;
  year?: number | null;
  track_number?: number | null;
  duration?: number | null;
  cover_art?: string | null;
  lyrics?: string | null;
  file_name: string;
}

function normalizeTrack(raw: RawTrackMetadata): Track {
  return {
    path: raw.path,
    title: localizeTrackTitle(raw.title || raw.file_name || "Unknown Title"),
    artist: raw.artist || "Unknown Artist",
    album: raw.album || "Unknown Album",
    albumArtist: raw.album_artist || raw.artist || "Unknown Artist",
    genre: raw.genre || "",
    year: raw.year ?? null,
    trackNumber: raw.track_number ?? null,
    duration: raw.duration || 0,
    coverArt: raw.cover_art ? `data:image/jpeg;base64,${raw.cover_art}` : null,
    lyrics: raw.lyrics || null,
    fileName: raw.file_name,
  };
}

export function useLibrary() {
  const setTracks = useLibraryStore((s) => s.setTracks);
  const setIsScanning = useLibraryStore((s) => s.setIsScanning);
  const setSelectedFolder = useLibraryStore((s) => s.setSelectedFolder);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const importFolder = useCallback(
    async (folder: string, remember = true) => {
      setIsScanning(true);
      setSelectedFolder(folder);

      try {
        const rawTracks: RawTrackMetadata[] = await invoke("scan_music_folder", {
          path: folder,
        });

        const tracks = rawTracks.map(normalizeTrack);
        setTracks(tracks);
        if (tracks.length > 0) {
          setQueue(tracks, 0);
        }
        if (remember) {
          localStorage.setItem(LAST_LIBRARY_FOLDER_KEY, folder);
        }
      } catch (err) {
        console.error("导入音乐文件夹失败:", err);
        if (remember) {
          localStorage.removeItem(LAST_LIBRARY_FOLDER_KEY);
          setSelectedFolder(null);
        }
      } finally {
        setIsScanning(false);
      }
    },
    [setTracks, setIsScanning, setSelectedFolder, setQueue]
  );

  const importFolderFromDialog = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "导入音乐文件夹",
      });

      if (!selected) return;

      const folder = Array.isArray(selected) ? selected[0] : selected;
      await importFolder(folder);
    } catch (err) {
      console.error("打开导入窗口失败:", err);
    }
  }, [importFolder]);

  const importLastFolder = useCallback(async () => {
    if (hasRestoredLastFolder) return;
    hasRestoredLastFolder = true;

    const lastFolder = localStorage.getItem(LAST_LIBRARY_FOLDER_KEY);
    if (!lastFolder) return;

    await importFolder(lastFolder, false);
  }, [importFolder]);

  return { importFolder, importFolderFromDialog, importLastFolder };
}
