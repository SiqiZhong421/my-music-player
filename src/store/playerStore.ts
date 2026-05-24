import { create } from "zustand";
import type { Track, RepeatMode } from "@/types";

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

  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleLyricsPanel: () => void;
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
  queue: [],
  queueIndex: -1,

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

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleLyricsPanel: () =>
    set((state) => ({ showLyricsPanel: !state.showLyricsPanel })),

  setQueue: (queue, startIndex = 0) =>
    set({
      queue,
      queueIndex: startIndex,
      currentTrack: queue[startIndex] || null,
      currentTime: 0,
      duration: queue[startIndex]?.duration || 0,
    }),

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, shuffle } = get();
    if (queue.length === 0) return null;

    if (repeatMode === "one") {
      return get().currentTrack;
    }

    let nextIndex: number;
    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === queueIndex);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        nextIndex = 0;
      }
    }

    const nextTrack = queue[nextIndex];
    set({ queueIndex: nextIndex, currentTrack: nextTrack, currentTime: 0, duration: nextTrack?.duration || 0 });
    return nextTrack;
  },

  prevTrack: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return null;

    // If we're more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return get().currentTrack;
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
