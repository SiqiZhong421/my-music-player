export interface Track {
  path: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  genre: string;
  year: number | null;
  trackNumber: number | null;
  duration: number;
  coverArt: string | null; // base64 data URL or null
  lyrics: string | null;
  fileName: string;
}

export interface Album {
  title: string;
  artist: string;
  coverArt: string | null;
  tracks: Track[];
  year: number | null;
}

export interface Artist {
  name: string;
  albums: Album[];
  trackCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export type RepeatMode = "one" | "all";

export interface PlayerState {
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
}
