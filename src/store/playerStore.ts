import { create } from "zustand";
import type { Track, RepeatMode } from "@/types";

type Theme = "dark" | "light";

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem("music-player:theme");
    if (stored === "light") return "light";
  } catch {}
  return "dark";
}

function saveTheme(theme: Theme) {
  localStorage.setItem("music-player:theme", theme);
}

interface PlayerStore {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  showLyricsPanel: boolean;
  queue: Track[];
  queueIndex: number;
  history: number[];
  theme: Theme;

  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleLyricsPanel: () => void;
  toggleTheme: () => void;
  setQueue: (queue: Track[], startIndex?: number) => void;
  nextTrack: () => Track | null;
  prevTrack: () => Track | null;
  playTrackAt: (index: number) => Track | null;
  removeFromQueue: (index: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  repeatMode: "all",
  shuffle: false,
  showLyricsPanel: false,
  theme: loadTheme(),
  queue: [],
  queueIndex: -1,
  history: [],

  setCurrentTrack: (track) =>
    set({
      currentTrack: track,
      currentTime: 0,
      duration: track?.duration || 0,
    }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  toggleRepeat: () =>
    set((state) => ({
      repeatMode: state.repeatMode === "all" ? "one" : "all",
    })),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle, history: [] })),

  toggleLyricsPanel: () =>
    set((state) => ({ showLyricsPanel: !state.showLyricsPanel })),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      saveTheme(next);
      return { theme: next };
    }),

  setQueue: (queue, startIndex = 0) =>
    set({
      queue,
      queueIndex: startIndex,
      currentTrack: queue[startIndex] || null,
      currentTime: 0,
      duration: queue[startIndex]?.duration || 0,
      history: [],
    }),

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, shuffle } = get();
    if (queue.length === 0) return null;

    if (repeatMode === "one") {
      return get().currentTrack;
    }

    let nextIndex: number;
    if (shuffle && queue.length > 1) {
      const history = [...get().history, queueIndex];
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === queueIndex);
      const nextTrack = queue[nextIndex];
      set({ queueIndex: nextIndex, currentTrack: nextTrack, currentTime: 0, duration: nextTrack?.duration || 0, history });
      return nextTrack;
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        nextIndex = 0;
      }
      const nextTrack = queue[nextIndex];
      set({ queueIndex: nextIndex, currentTrack: nextTrack, currentTime: 0, duration: nextTrack?.duration || 0 });
      return nextTrack;
    }
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime, shuffle, history } = get();
    if (queue.length === 0) return null;

    // If we're more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return get().currentTrack;
    }

    // In shuffle mode, go back through play history
    if (shuffle && history.length > 0) {
      const newHistory = history.slice(0, -1);
      const prevIndex = history[history.length - 1];
      const prevTrack = queue[prevIndex];
      set({ queueIndex: prevIndex, currentTrack: prevTrack, currentTime: 0, duration: prevTrack?.duration || 0, history: newHistory });
      return prevTrack;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    const prevTrack = queue[prevIndex];
    set({ queueIndex: prevIndex, currentTrack: prevTrack, currentTime: 0, duration: prevTrack?.duration || 0 });
    return prevTrack;
  },

  playTrackAt: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return null;
    const track = queue[index];
    set({ queueIndex: index, currentTrack: track, currentTime: 0, duration: track?.duration || 0 });
    return track;
  },

  removeFromQueue: (index) => {
    const { queue, queueIndex, isPlaying } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = queueIndex;

    if (newQueue.length === 0) {
      set({ queue: [], queueIndex: -1, currentTrack: null, currentTime: 0, duration: 0, isPlaying: false });
      return;
    }

    if (index === queueIndex) {
      // Removed current track — play next track at same index (which is now the next song)
      newIndex = Math.min(index, newQueue.length - 1);
      const nextTrack = newQueue[newIndex];
      set({ queue: newQueue, queueIndex: newIndex, currentTrack: nextTrack, currentTime: 0, duration: nextTrack?.duration || 0, isPlaying });
    } else if (index < queueIndex) {
      newIndex = queueIndex - 1;
      set({ queue: newQueue, queueIndex: newIndex });
    } else {
      set({ queue: newQueue });
    }
  },
}));
