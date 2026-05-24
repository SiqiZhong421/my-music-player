import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Track, Album, Artist, Playlist } from "@/types";

const PLAYLISTS_STORAGE_KEY = "music-player:playlists";

function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePlaylists(playlists: Playlist[]) {
  localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
}

interface LibraryStore {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  isScanning: boolean;
  selectedFolder: string | null;
  currentView: "tracks" | "albums" | "artists" | "playlist" | "nowplaying" | "queue";
  selectedAlbum: Album | null;
  selectedArtist: Artist | null;
  selectedPlaylistId: string | null;
  searchQuery: string;

  setTracks: (tracks: Track[]) => void;
  setIsScanning: (scanning: boolean) => void;
  setSelectedFolder: (folder: string | null) => void;
  setCurrentView: (view: "tracks" | "albums" | "artists" | "playlist" | "nowplaying" | "queue") => void;
  setSelectedAlbum: (album: Album | null) => void;
  setSelectedArtist: (artist: Artist | null) => void;
  setSelectedPlaylist: (playlistId: string | null) => void;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTracksToPlaylist: (playlistId: string, tracks: Track[]) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackPath: string) => void;
  removeTrack: (trackPath: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  getSelectedPlaylist: () => Playlist | null;
}

function buildAlbumsAndArtists(tracks: Track[]): { albums: Album[]; artists: Artist[] } {
  const albumMap = new Map<string, Album>();
  const artistMap = new Map<string, Artist>();

  for (const track of tracks) {
    const albumKey = `${track.albumArtist || track.artist}-${track.album}`;

    if (!albumMap.has(albumKey)) {
      albumMap.set(albumKey, {
        title: track.album || "Unknown Album",
        artist: track.albumArtist || track.artist || "Unknown Artist",
        coverArt: track.coverArt,
        tracks: [],
        year: track.year,
      });
    }
    albumMap.get(albumKey)!.tracks.push(track);

    const artistName = track.albumArtist || track.artist || "Unknown Artist";
    if (!artistMap.has(artistName)) {
      artistMap.set(artistName, {
        name: artistName,
        albums: [],
        trackCount: 0,
      });
    }
    artistMap.get(artistName)!.trackCount += 1;
  }

  // Link albums to artists
  for (const album of albumMap.values()) {
    const artist = artistMap.get(album.artist);
    if (artist && !artist.albums.find((a) => a.title === album.title)) {
      artist.albums.push(album);
    }
  }

  return {
    albums: Array.from(albumMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
    artists: Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  albums: [],
  artists: [],
  playlists: loadPlaylists(),
  isScanning: false,
  selectedFolder: null,
  currentView: "tracks",
  selectedAlbum: null,
  selectedArtist: null,
  selectedPlaylistId: null,
  searchQuery: "",

  setTracks: (tracks) => {
    const { albums, artists } = buildAlbumsAndArtists(tracks);
    set({ tracks, albums, artists });
  },

  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedAlbum: (album) => set({ selectedAlbum: album }),
  setSelectedArtist: (artist) => set({ selectedArtist: artist }),
  setSelectedPlaylist: (playlistId) =>
    set({ selectedPlaylistId: playlistId, currentView: playlistId ? "playlist" : "tracks" }),

  createPlaylist: (name) => {
    const now = Date.now();
    const playlist: Playlist = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || "新歌单",
      tracks: [],
      createdAt: now,
      updatedAt: now,
    };
    const playlists = [...get().playlists, playlist];
    savePlaylists(playlists);
    set({ playlists, selectedPlaylistId: playlist.id, currentView: "playlist" });
    return playlist;
  },

  deletePlaylist: (playlistId) => {
    const playlists = get().playlists.filter((playlist) => playlist.id !== playlistId);
    savePlaylists(playlists);
    set((state) => ({
      playlists,
      selectedPlaylistId:
        state.selectedPlaylistId === playlistId ? playlists[0]?.id ?? null : state.selectedPlaylistId,
      currentView:
        state.selectedPlaylistId === playlistId && playlists.length === 0 ? "tracks" : state.currentView,
    }));
  },

  addTracksToPlaylist: async (playlistId, tracksToAdd) => {
    const copiedTracks = await Promise.all(
      tracksToAdd.map(async (track) => {
        try {
          const newPath: string = await invoke("copy_track_to_app_dir", {
            sourcePath: track.path,
          });
          return { ...track, path: newPath };
        } catch {
          return track;
        }
      })
    );

    const playlists = get().playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      const existingPaths = new Set(playlist.tracks.map((track) => track.path));
      const newTracks = copiedTracks.filter((track) => !existingPaths.has(track.path));
      return {
        ...playlist,
        tracks: [...playlist.tracks, ...newTracks],
        updatedAt: Date.now(),
      };
    });
    savePlaylists(playlists);
    set({ playlists });
  },

  removeTrackFromPlaylist: (playlistId, trackPath) => {
    const playlists = get().playlists.map((playlist) =>
      playlist.id === playlistId
        ? {
            ...playlist,
            tracks: playlist.tracks.filter((track) => track.path !== trackPath),
            updatedAt: Date.now(),
          }
        : playlist
    );
    savePlaylists(playlists);
    set({ playlists });
  },

  removeTrack: async (trackPath) => {
    try {
      await invoke("delete_track_from_library", { trackPath });
    } catch {
      // Continue with local removal even if backend fails
    }
    const tracks = get().tracks.filter((t) => t.path !== trackPath);
    const { albums, artists } = buildAlbumsAndArtists(tracks);
    set({ tracks, albums, artists });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  getSelectedPlaylist: () => {
    const { playlists, selectedPlaylistId } = get();
    return playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null;
  },
}));
