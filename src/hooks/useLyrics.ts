import { useState, useEffect, useMemo, useRef } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { parseLrc, findCurrentLyricIndex } from "@/utils/lrcParser";
import { usePlayerStore } from "@/store/playerStore";
import type { LyricLine } from "@/types";

export function useLyrics() {
  const current = usePlayerStore((s) => s.current);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [hasLrcFile, setHasLrcFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentLineRef = useRef<HTMLDivElement | null>(null);

  // Load lyrics when track changes
  useEffect(() => {
    if (!current) {
      setLyrics([]);
      setHasLrcFile(false);
      return;
    }

    const loadLyrics = async () => {
      setLoading(true);
      setLyrics([]);
      setHasLrcFile(false);

      // First try embedded lyrics from metadata
      if (current.lyrics) {
        const parsed = parseLrc(current.lyrics);
        if (parsed.length > 0) {
          setLyrics(parsed);
          setHasLrcFile(true);
          setLoading(false);
          return;
        }
      }

      // Then try external .lrc file
      const lrcPath = current.path.replace(/\.[^/.]+$/, ".lrc");
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
  }, [current]);

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
