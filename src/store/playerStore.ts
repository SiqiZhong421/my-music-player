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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlayerStore {
  current: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  history: Track[];
  upcoming: Track[];
  source: Track[];

  repeatMode: RepeatMode;
  shuffle: boolean;
  showLyricsPanel: boolean;
  theme: Theme;

  setCurrent: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;

  setQueue: (tracks: Track[], startIndex?: number) => void;
  next: () => Track | null;
  prev: () => Track | null;
  jumpTo: (track: Track) => void;
  playNext: (track: Track) => void;
  playLast: (track: Track) => void;
  removeFromUpcoming: (index: number) => void;
  clearQueue: () => void;
  playFrom: (track: Track, startIndex: number, sourceTracks?: Track[]) => void;

  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleLyricsPanel: () => void;
  toggleTheme: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  current: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,

  history: [],
  upcoming: [],
  source: [],

  repeatMode: "all",
  shuffle: false,
  showLyricsPanel: false,
  theme: loadTheme(),

  setCurrent: (track) =>
    set({
      current: track,
      currentTime: 0,
      duration: track?.duration || 0,
    }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  setQueue: (tracks, startIndex = 0) =>
    set((state) => {
      const current = tracks[startIndex];
      let upcoming = [
        ...tracks.slice(0, startIndex),
        ...tracks.slice(startIndex + 1),
      ];
      if (state.shuffle) {
        upcoming = shuffleArray(upcoming);
      }
      return {
        current,
        upcoming,
        history: [],
        source: [...tracks],
        currentTime: 0,
        duration: current?.duration || 0,
      };
    }),

  next: () => {
    const state = get();
    if (!state.current) return null;

    if (state.repeatMode === "one") {
      return state.current;
    }

    if (state.upcoming.length === 0) {
      if (state.repeatMode === "all") {
        // Refill upcoming from all played tracks + current
        const pool = [
          ...state.history.map((t) => ({ ...t })),
          { ...state.current },
          ...state.upcoming.map((t) => ({ ...t })),
        ];
        // Deduplicate by path
        const seen = new Set<string>();
        const unique = pool.filter((t) => {
          if (seen.has(t.path)) return false;
          seen.add(t.path);
          return true;
        });
        if (unique.length <= 1) return null;
        const withoutCurrent = unique.filter((t) => t.path !== state.current!.path);
        let refill = state.shuffle ? shuffleArray(withoutCurrent) : withoutCurrent;
        const next = refill[0];
        set({
          history: [...state.history, state.current],
          current: next,
          upcoming: refill.slice(1),
          currentTime: 0,
          duration: next.duration || 0,
        });
        return next;
      }
      return null;
    }

    const next = state.upcoming[0];
    set({
      history: [...state.history, state.current],
      current: next,
      upcoming: state.upcoming.slice(1),
      currentTime: 0,
      duration: next.duration || 0,
    });
    return next;
  },

  prev: () => {
    const state = get();
    if (!state.current) return null;

    if (state.currentTime > 3) {
      set({ currentTime: 0 });
      return state.current;
    }

    if (state.history.length === 0) return state.current;

    const prev = state.history[state.history.length - 1];
    set({
      history: state.history.slice(0, -1),
      upcoming: [state.current, ...state.upcoming],
      current: prev,
      currentTime: 0,
      duration: prev.duration || 0,
    });
    return prev;
  },

  jumpTo: (track) => {
    const state = get();
    if (!state.current) return;

    // Same track: restart
    if (state.current.path === track.path) {
      set({ currentTime: 0 });
      return;
    }

    // Track is in upcoming
    const upIdx = state.upcoming.findIndex((t) => t.path === track.path);
    if (upIdx >= 0) {
      const newHistory = [...state.history];
      if (state.current) newHistory.push(state.current);
      newHistory.push(...state.upcoming.slice(0, upIdx));
      set({
        history: newHistory,
        current: track,
        upcoming: state.upcoming.slice(upIdx + 1),
        currentTime: 0,
        duration: track.duration || 0,
      });
      return;
    }

    // Track is in history
    const histIdx = state.history.findIndex((t) => t.path === track.path);
    if (histIdx >= 0) {
      const newHistory = state.history.slice(0, histIdx);
      const restored = [
        ...state.history.slice(histIdx + 1),
        state.current,
      ];
      set({
        history: newHistory,
        current: track,
        upcoming: [...restored, ...state.upcoming],
        currentTime: 0,
        duration: track.duration || 0,
      });
    }
  },

  playNext: (track) =>
    set((state) => ({
      upcoming: [track, ...state.upcoming],
      source: [...state.source, track],
    })),

  playLast: (track) =>
    set((state) => ({
      upcoming: [...state.upcoming, track],
      source: [...state.source, track],
    })),

  removeFromUpcoming: (index) =>
    set((state) => ({
      upcoming: state.upcoming.filter((_, i) => i !== index),
    })),

  clearQueue: () =>
    set({
      history: [],
      current: null,
      upcoming: [],
      isPlaying: false,
      currentTime: 0,
    }),

  playFrom: (track, startIndex, sourceTracks) =>
    set((state) => {
      const oldCurrent = state.current;
      const newHistory =
        oldCurrent && oldCurrent.path !== track.path
          ? [...state.history, oldCurrent]
          : state.history;

      const historyPaths = new Set(newHistory.map((t) => t.path));
      historyPaths.add(track.path);

      const src = sourceTracks ?? state.source;

      if (state.shuffle) {
        const pool = src.filter((t) => !historyPaths.has(t.path));
        return {
          current: track,
          history: newHistory,
          upcoming: shuffleArray(pool),
          source: sourceTracks ?? state.source,
          currentTime: 0,
          duration: track.duration || 0,
        };
      }

      return {
        current: track,
        history: newHistory,
        upcoming: src.slice(startIndex + 1),
        source: sourceTracks ?? state.source,
        currentTime: 0,
        duration: track.duration || 0,
      };
    }),

  toggleRepeat: () =>
    set((state) => ({
      repeatMode:
        state.repeatMode === "all"
          ? "one"
          : state.repeatMode === "one"
            ? "all"
            : "all",
    })),

  toggleShuffle: () =>
    set((state) => {
      const enabling = !state.shuffle;
      if (enabling && state.upcoming.length > 0) {
        return { shuffle: true, upcoming: shuffleArray(state.upcoming) };
      }
      return { shuffle: !state.shuffle };
    }),

  toggleLyricsPanel: () =>
    set((state) => ({ showLyricsPanel: !state.showLyricsPanel })),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      saveTheme(next);
      return { theme: next };
    }),
}));
