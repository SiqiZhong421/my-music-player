import { useEffect, useRef, useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";

let globalAudio: HTMLAudioElement | null = null;
let listenersAttached = false;
let controllerOwner: symbol | null = null;

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio();
  }
  return globalAudio;
}

export function useAudioPlayer() {
  const ownerRef = useRef(Symbol("audio-player-owner"));

  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const storeNext = usePlayerStore((s) => s.next);
  const storePrev = usePlayerStore((s) => s.prev);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const jumpTo = usePlayerStore((s) => s.jumpTo);
  const tracks = useLibraryStore((s) => s.tracks);

  useEffect(() => {
    if (!controllerOwner) {
      controllerOwner = ownerRef.current;
    }
    return () => {
      if (controllerOwner === ownerRef.current) {
        controllerOwner = null;
      }
    };
  }, []);

  useEffect(() => {
    if (listenersAttached) return;
    listenersAttached = true;

    const audio = getAudio();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const next = usePlayerStore.getState().next();
      if (!next) {
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        const a = getAudio();
        const targetSrc = convertFileSrc(next.path);
        if (a.src !== targetSrc) {
          a.src = targetSrc;
          a.load();
        }
        setIsPlaying(true);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      const a = getAudio();
      if (!a.ended) setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      listenersAttached = false;
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;
    const audio = getAudio();
    if (!current) return;

    const targetSrc = convertFileSrc(current.path);
    if (audio.src !== targetSrc) {
      audio.src = targetSrc;
      audio.load();
    }
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [current?.path]); // eslint-disable-line

  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;
    const audio = getAudio();
    if (!current) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, current]); // eslint-disable-line

  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;
    getAudio().volume = volume;
  }, [volume]);

  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;
    getAudio().loop = repeatMode === "one";
  }, [repeatMode]);

  const seek = useCallback((time: number) => {
    const audio = getAudio();
    audio.currentTime = time;
    setCurrentTime(time);
  }, [setCurrentTime]);

  const playTrack = useCallback(
    (track: typeof current, autoPlay = true) => {
      if (!track) return;
      const state = usePlayerStore.getState();

      // If no session active, start one from library
      if (!state.current && state.upcoming.length === 0 && tracks.length > 0) {
        const idx = tracks.findIndex((t) => t.path === track.path);
        setQueue(tracks, idx >= 0 ? idx : 0);
        if (autoPlay) setIsPlaying(true);
        return;
      }

      // Navigate to track in current session, or add as next
      const inSession =
        state.current?.path === track.path ||
        state.upcoming.some((t) => t.path === track.path) ||
        state.history.some((t) => t.path === track.path);
      if (inSession) {
        jumpTo(track);
      } else {
        state.playNext(track);
      }
      if (autoPlay) setIsPlaying(true);
    },
    [setCurrent, setIsPlaying, setQueue, jumpTo, tracks]
  );

  const togglePlay = useCallback(() => {
    if (!current && tracks.length > 0) {
      playTrack(tracks[0]);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [current, isPlaying, setIsPlaying, tracks, playTrack]);

  const skipNext = useCallback(() => {
    const n = storeNext();
    if (n) setIsPlaying(true);
  }, [storeNext, setIsPlaying]);

  const skipPrev = useCallback(() => {
    const p = storePrev();
    if (p) setIsPlaying(true);
  }, [storePrev, setIsPlaying]);

  return {
    seek,
    playTrack,
    togglePlay,
    skipNext,
    skipPrev,
  };
}
