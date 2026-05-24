import { useState, useEffect, useMemo, useRef } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { parseLrc, findCurrentLyricIndex } from "@/utils/lrcParser";
import { usePlayerStore } from "@/store/playerStore";
import type { LyricLine } from "@/types";

export function useLyrics() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [hasLrcFile, setHasLrcFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentLineRef = useRef<HTMLDivElement | null>(null);

  // Load lyrics when track changes
  useEffect(() => {
    if (!currentTrack) {
      setLyrics([]);
      setHasLrcFile(false);
      return;
    }

    const loadLyrics = async () => {
      setLoading(true);
      setLyrics([]);
      setHasLrcFile(false);

      // First try embedded lyrics from metadata
      if (currentTrack.lyrics) {
        const parsed = parseLrc(currentTrack.lyrics);
        if (parsed.length > 0) {
          setLyrics(parsed);
          setHasLrcFile(true);
          setLoading(false);
          return;
        }
      }

      // Then try external .lrc file
      const lrcPath = currentTrack.path.replace(/\.[^/.]+$/, ".lrc");
      try {
        const content = await readTextFile(lrcPath);
        const parsed = parseLrc(content);
        if (parsed.length > 0) {
          setLyrics(parsed);
          setHasLrcFile(true);
        }
      } catch {
        // No lrc file found
        setHasLrcFile(false);
      } finally {
        setLoading(false);
      }
    };

    loadLyrics();
  }, [currentTrack]);

  const currentLineIndex = useMemo(() => {
    return findCurrentLyricIndex(lyrics, currentTime);
  }, [lyrics, currentTime]);

  // Auto scroll to current line
  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex]);

  return {
    lyrics,
    currentLineIndex,
    hasLrcFile,
    loading,
    currentLineRef,
  };
}
