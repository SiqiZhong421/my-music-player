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

function generateShuffledOrder(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const pos = indices.indexOf(currentIndex);
  if (pos > 0) {
    indices.splice(pos, 1);
    indices.unshift(currentIndex);
  }
  return indices;
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
  shuffledOrder: number[];
  shuffledPosition: number;
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
  insertNextInShuffle: (track: Track) => void;
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
  shuffledOrder: [],
  shuffledPosition: -1,

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

  toggleShuffle: () =>
    set((state) => {
      const enabling = !state.shuffle;
      if (enabling) {
        const order = generateShuffledOrder(state.queue.length, state.queueIndex);
        return {
          shuffle: true,
          shuffledOrder: order,
          shuffledPosition: 0,
          history: [],
        };
      }
      return { shuffle: false, shuffledOrder: [], shuffledPosition: -1 };
    }),

  toggleLyricsPanel: () =>
    set((state) => ({ showLyricsPanel: !state.showLyricsPanel })),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      saveTheme(next);
      return { theme: next };
    }),

  setQueue: (queue, startIndex = 0) =>
    set((state) => {
      const base: Partial<PlayerStore> = {
        queue,
        queueIndex: startIndex,
        currentTrack: queue[startIndex] || null,
        currentTime: 0,
        duration: queue[startIndex]?.duration || 0,
        history: [],
      };
      if (state.shuffle && queue.length > 0) {
        base.shuffledOrder = generateShuffledOrder(queue.length, startIndex);
        base.shuffledPosition = 0;
      }
      return base;
    }),

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, shuffle, shuffledOrder, shuffledPosition } = get();
    if (queue.length === 0) return null;

    if (repeatMode === "one") {
      return get().currentTrack;
    }

    if (shuffle && shuffledOrder.length > 0) {
      let nextPos = shuffledPosition + 1;
      if (nextPos >= shuffledOrder.length) nextPos = 0;
      const nextIndex = shuffledOrder[nextPos];
      const nextTrack = queue[nextIndex];
      const history = [...get().history, queueIndex];
      set({
        shuffledPosition: nextPos,
        queueIndex: nextIndex,
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack?.duration || 0,
        history,
      });
      return nextTrack;
    }

    let nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) nextIndex = 0;
    const nextTrack = queue[nextIndex];
    set({
      queueIndex: nextIndex,
      currentTrack: nextTrack,
      currentTime: 0,
      duration: nextTrack?.duration || 0,
    });
    return nextTrack;
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime, shuffle, history, shuffledOrder, shuffledPosition } = get();
    if (queue.length === 0) return null;

    if (currentTime > 3) {
      set({ currentTime: 0 });
      return get().currentTrack;
    }

    if (shuffle && shuffledOrder.length > 0) {
      if (history.length > 0) {
        const newHistory = history.slice(0, -1);
        const prevIndex = history[history.length - 1];
        const prevTrack = queue[prevIndex];
        const pos = shuffledOrder.indexOf(prevIndex);
        set({
          shuffledPosition: pos >= 0 ? pos : shuffledPosition,
          queueIndex: prevIndex,
          currentTrack: prevTrack,
          currentTime: 0,
          duration: prevTrack?.duration || 0,
          history: newHistory,
        });
        return prevTrack;
      }
      let prevPos = shuffledPosition - 1;
      if (prevPos < 0) prevPos = shuffledOrder.length - 1;
      const prevIndex = shuffledOrder[prevPos];
      const prevTrack = queue[prevIndex];
      set({
        shuffledPosition: prevPos,
        queueIndex: prevIndex,
        currentTrack: prevTrack,
        currentTime: 0,
        duration: prevTrack?.duration || 0,
      });
      return prevTrack;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    const prevTrack = queue[prevIndex];
    set({
      queueIndex: prevIndex,
      currentTrack: prevTrack,
      currentTime: 0,
      duration: prevTrack?.duration || 0,
    });
    return prevTrack;
  },

  playTrackAt: (index) => {
    const { queue, shuffle, shuffledOrder, queueIndex } = get();
    if (index < 0 || index >= queue.length) return null;
    const track = queue[index];

    if (shuffle && shuffledOrder.length > 0) {
      const pos = shuffledOrder.indexOf(index);
      if (pos >= 0) {
        const history = [...get().history, queueIndex];
        set({
          shuffledPosition: pos,
          queueIndex: index,
          currentTrack: track,
          currentTime: 0,
          duration: track?.duration || 0,
          history,
        });
      } else {
        set({
          queueIndex: index,
          currentTrack: track,
          currentTime: 0,
          duration: track?.duration || 0,
        });
      }
    } else {
      set({
        queueIndex: index,
        currentTrack: track,
        currentTime: 0,
        duration: track?.duration || 0,
      });
    }
    return track;
  },

  insertNextInShuffle: (track) => {
    const { queue, shuffledOrder, shuffledPosition } = get();
    const newQueue = [...queue, track];
    const newIndex = newQueue.length - 1;
    const newOrder = [...shuffledOrder];
    newOrder.splice(shuffledPosition + 1, 0, newIndex);
    set({ queue: newQueue, shuffledOrder: newOrder });
  },

  removeFromQueue: (index) => {
    const { queue, queueIndex, isPlaying } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = queueIndex;

    if (newQueue.length === 0) {
      set({
        queue: [],
        queueIndex: -1,
        currentTrack: null,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        shuffledOrder: [],
        shuffledPosition: -1,
        history: [],
      });
      return;
    }

    if (index === queueIndex) {
      newIndex = Math.min(index, newQueue.length - 1);
      const nextTrack = newQueue[newIndex];
      set({
        queue: newQueue,
        queueIndex: newIndex,
        currentTrack: nextTrack,
        currentTime: 0,
        duration: nextTrack?.duration || 0,
        isPlaying,
        history: [],
      });
    } else if (index < queueIndex) {
      newIndex = queueIndex - 1;
      set({ queue: newQueue, queueIndex: newIndex });
    } else {
      set({ queue: newQueue });
    }
  },
}));
