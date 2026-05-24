import { useEffect, useRef, useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";

// Module-level singleton audio instance
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

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const setCurrentTrack = usePlayerStore((s) => s.setCurrentTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const tracks = useLibraryStore((s) => s.tracks);

  // Only one hook instance should drive the shared audio element. Other
  // instances can still expose callbacks for buttons and lists.
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

  // Initialize audio element once globally
  useEffect(() => {
    if (listenersAttached) return;
    listenersAttached = true;

    const audio = getAudio();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      const next = usePlayerStore.getState().nextTrack();
      if (!next) {
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        setIsPlaying(true);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      const audio = getAudio();
      if (!audio.ended) setIsPlaying(false);
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

  // Load track when currentTrack changes
  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;

    const audio = getAudio();
    if (!currentTrack) return;

    const targetSrc = convertFileSrc(currentTrack.path);
    if (audio.src !== targetSrc) {
      audio.src = targetSrc;
      audio.load();
    }
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack?.path]); // eslint-disable-line

  // Play/pause control
  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;

    const audio = getAudio();
    if (!currentTrack) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]); // eslint-disable-line

  // Volume control
  useEffect(() => {
    if (controllerOwner !== ownerRef.current) return;

    getAudio().volume = volume;
  }, [volume]);

  // Repeat mode on audio element
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
    (track: typeof currentTrack, autoPlay = true) => {
      if (!track) return;
      const state = usePlayerStore.getState();
      if (state.queue.length === 0 && tracks.length > 0) {
        const idx = tracks.findIndex((t) => t.path === track.path);
        setQueue(tracks, idx >= 0 ? idx : 0);
      } else {
        setCurrentTrack(track);
      }
      if (autoPlay) setIsPlaying(true);
    },
    [setCurrentTrack, setIsPlaying, setQueue, tracks]
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0]);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [currentTrack, isPlaying, setIsPlaying, tracks, playTrack]);

  const skipNext = useCallback(() => {
    const next = nextTrack();
    if (next) setIsPlaying(true);
  }, [nextTrack, setIsPlaying]);

  const skipPrev = useCallback(() => {
    const state = usePlayerStore.getState();
    const prev = state.prevTrack();
    if (prev) setIsPlaying(true);
  }, [setIsPlaying]);

  return {
    seek,
    playTrack,
    togglePlay,
    skipNext,
    skipPrev,
  };
}
