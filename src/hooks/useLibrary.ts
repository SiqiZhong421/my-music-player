import { useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "@/store/libraryStore";
import { usePlayerStore } from "@/store/playerStore";
import { localizeTrackTitle } from "@/utils/trackTitles";
import { deduplicateTrackTitles } from "@/utils/deduplicateTitles";
import type { Track } from "@/types";

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

function resolveCoverArt(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // File path → asset protocol URL
  if (raw.includes("\\") || raw.includes("/")) {
    return convertFileSrc(raw);
  }
  // Legacy base64 → data URL
  return `data:image/jpeg;base64,${raw}`;
}

function normalizeTrack(raw: RawTrackMetadata): Track {
  const coverArt = resolveCoverArt(raw.cover_art);

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
    coverArt,
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
    async (folder: string) => {
      setIsScanning(true);
      setSelectedFolder(folder);

      try {
        const rawTracks: RawTrackMetadata[] = await invoke("import_folder_to_library", {
          sourcePath: folder,
        });

        const tracks = deduplicateTrackTitles(rawTracks.map(normalizeTrack));
        setTracks(tracks);
        if (tracks.length > 0) {
          setQueue(tracks, 0);
        }
      } catch (err) {
        console.error("导入音乐文件夹失败:", err);
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

    try {
      const rawTracks: RawTrackMetadata[] = await invoke("load_library");
      const tracks = deduplicateTrackTitles(rawTracks.map(normalizeTrack));
      setTracks(tracks);
      if (tracks.length > 0) {
        setQueue(tracks, 0);
      }
    } catch (err) {
      console.error("加载音乐库失败:", err);
    }
  }, [setTracks, setQueue]);

  return { importFolder, importFolderFromDialog, importLastFolder };
}
