import type { ReactNode } from "react";
import { Disc, Mic2, Music } from "lucide-react";
import { useLibraryStore } from "@/store/libraryStore";
import { TrackList } from "@/components/Library/TrackList";
import { NowPlaying } from "@/components/Player/NowPlaying";
import { LyricsScroller } from "@/components/Player/LyricsScroller";
import { usePlayerStore } from "@/store/playerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AlbumArt } from "@/components/Player/AlbumArt";
import { QueueView } from "@/components/Library/QueueView";

export function MainContent() {
  const currentView = useLibraryStore((s) => s.currentView);
  const albums = useLibraryStore((s) => s.albums);
  const artists = useLibraryStore((s) => s.artists);
  const setSelectedAlbum = useLibraryStore((s) => s.setSelectedAlbum);
  const setSelectedArtist = useLibraryStore((s) => s.setSelectedArtist);
  const { playTrack } = useAudioPlayer();
  const setQueue = usePlayerStore((s) => s.setQueue);
  const showLyricsPanel = usePlayerStore((s) => s.showLyricsPanel);
  const selectedPlaylist = useLibraryStore((s) => s.getSelectedPlaylist)();

  const renderWithLyrics = (content: ReactNode) => (
    <div className="flex-1 h-full min-w-0 flex overflow-hidden">
      <div className="flex-1 min-w-0 h-full overflow-hidden">{content}</div>
      {showLyricsPanel && (
        <div className="w-[360px] border-l border-white/[0.06] bg-black/20 hidden lg:block">
          <LyricsScroller />
        </div>
      )}
    </div>
  );

  if (currentView === "nowplaying") {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <NowPlaying />
      </div>
    );
  }

  if (currentView === "albums") {
    return renderWithLyrics(
      <div className="flex-1 h-full overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-6">专辑</h2>
        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30">
            <Disc size={48} strokeWidth={1} className="mb-4" />
            <p>暂无专辑</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {albums.map((album) => (
              <div
                key={`${album.artist}-${album.title}`}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedAlbum(album);
                  setQueue(album.tracks, 0);
                  playTrack(album.tracks[0], true);
                }}
              >
                <AlbumArt
                  coverArt={album.coverArt}
                  size="lg"
                  className="w-full aspect-square rounded-xl mb-3 group-hover:scale-[1.02] transition-transform duration-300"
                />
                <p className="text-sm font-medium text-white/90 truncate">{album.title}</p>
                <p className="text-xs text-white/40 truncate">
                  {album.artist} · {album.year || ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (currentView === "artists") {
    return renderWithLyrics(
      <div className="flex-1 h-full overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-6">艺人</h2>
        {artists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30">
            <Mic2 size={48} strokeWidth={1} className="mb-4" />
            <p>暂无艺人</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {artists.map((artist) => (
              <div
                key={artist.name}
                className="group cursor-pointer text-center"
                onClick={() => {
                  setSelectedArtist(artist);
                  const allTracks = artist.albums.flatMap((a) => a.tracks);
                  if (allTracks.length > 0) {
                    setQueue(allTracks, 0);
                    playTrack(allTracks[0], true);
                  }
                }}
              >
                <div className="w-full aspect-square rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-3 group-hover:scale-[1.02] transition-transform duration-300">
                  <Music size={40} className="text-white/20" />
                </div>
                <p className="text-sm font-medium text-white/90 truncate">{artist.name}</p>
                <p className="text-xs text-white/40 truncate">{artist.trackCount} 首歌曲</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (currentView === "playlist" && selectedPlaylist) {
    return renderWithLyrics(
      <div className="flex-1 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
              <p className="text-sm text-white/40 mt-1">
                {selectedPlaylist.tracks.length} 首歌曲
              </p>
            </div>
            {selectedPlaylist.tracks.length > 0 && (
              <button
                onClick={() => {
                  setQueue(selectedPlaylist.tracks, 0);
                  playTrack(selectedPlaylist.tracks[0], true);
                }}
                className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-medium transition-colors"
              >
                播放全部
              </button>
            )}
          </div>
          <TrackList
            tracksOverride={selectedPlaylist.tracks}
            playlistId={selectedPlaylist.id}
            emptyTitle="歌单为空"
            emptyHint="从资料库选择歌曲加入此歌单"
          />
        </div>
      </div>
    );
  }

  if (currentView === "queue") {
    return renderWithLyrics(
      <div className="flex-1 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">播放队列</h2>
              <p className="text-sm text-white/40 mt-1">即将播放的歌曲</p>
            </div>
          </div>
          <QueueView />
        </div>
      </div>
    );
  }

  return renderWithLyrics(
    <div className="flex-1 h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">歌曲</h2>
            <p className="text-sm text-white/40 mt-1">资料库中的所有歌曲</p>
          </div>
        </div>
        <TrackList />
      </div>
    </div>
  );
}
