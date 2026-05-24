import { useMemo, useState } from "react";
import { CheckSquare, Clock, Play, Plus, Square, Trash2 } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { formatTime } from "@/utils/formatTime";
import { cn } from "@/utils/cn";
import type { Track } from "@/types";

interface TrackListProps {
  tracksOverride?: Track[];
  playlistId?: string;
  emptyTitle?: string;
  emptyHint?: string;
}

export function TrackList({
  tracksOverride,
  playlistId,
  emptyTitle = "资料库为空",
  emptyHint = "点击左下角按钮导入音乐文件夹",
}: TrackListProps) {
  const libraryTracks = useLibraryStore((s) => s.tracks);
  const filteredTracks = useLibraryStore((s) => s.getFilteredTracks());
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist);
  const removeTrackFromPlaylist = useLibraryStore((s) => s.removeTrackFromPlaylist);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const { playTrack } = useAudioPlayer();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [targetPlaylistId, setTargetPlaylistId] = useState("");

  const tracks = tracksOverride ?? filteredTracks;
  const queueSource = tracksOverride ?? libraryTracks;
  const canAddToPlaylist = !playlistId && libraryTracks.length > 0;
  const selectedTracks = useMemo(
    () => tracks.filter((track) => selectedPaths.has(track.path)),
    [tracks, selectedPaths]
  );

  const handlePlayTrack = (track: Track, index: number) => {
    if (queue.length === 0 || queue !== queueSource) {
      setQueue(queueSource, index);
    }
    playTrack(track, true);
  };

  const toggleSelected = (trackPath: string) => {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(trackPath)) {
        next.delete(trackPath);
      } else {
        next.add(trackPath);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedPaths.size === tracks.length) {
      setSelectedPaths(new Set());
      return;
    }
    setSelectedPaths(new Set(tracks.map((track) => track.path)));
  };

  const handleCreatePlaylist = async () => {
    const name = window.prompt("歌单名称");
    if (!name?.trim()) return;
    const playlist = createPlaylist(name);
    setTargetPlaylistId(playlist.id);
    if (selectedTracks.length > 0) {
      await addTracksToPlaylist(playlist.id, selectedTracks);
      setSelectedPaths(new Set());
    }
  };

  const handleAddToPlaylist = async () => {
    if (selectedTracks.length === 0) return;
    let playlistIdToUse = targetPlaylistId;

    if (!playlistIdToUse) {
      if (playlists.length === 0) {
        const name = window.prompt("歌单名称");
        if (!name?.trim()) return;
        playlistIdToUse = createPlaylist(name).id;
      } else {
        playlistIdToUse = playlists[0].id;
      }
      setTargetPlaylistId(playlistIdToUse);
    }

    await addTracksToPlaylist(playlistIdToUse, selectedTracks);
    setSelectedPaths(new Set());
  };

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <p>{emptyTitle}</p>
        <p className="text-sm mt-1">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {canAddToPlaylist && (
        <div className="flex items-center gap-2 px-1 pb-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            {selectedPaths.size === tracks.length ? <CheckSquare size={15} /> : <Square size={15} />}
            <span>{selectedPaths.size > 0 ? `已选 ${selectedPaths.size} 首` : "批量选择"}</span>
          </button>

          <select
            value={targetPlaylistId}
            onChange={(event) => setTargetPlaylistId(event.target.value)}
            className="h-8 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 text-xs text-white focus:outline-none"
          >
            <option value="">选择歌单</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddToPlaylist}
            disabled={selectedTracks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={14} />
            加入歌单
          </button>

          <button
            onClick={handleCreatePlaylist}
            className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            新建歌单
          </button>
        </div>
      )}

      <div className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
        <span className="w-5" />
        <span className="w-8 text-center">#</span>
        <span>标题</span>
        <span className="hidden md:block">专辑</span>
        <span className="w-16 text-right flex items-center justify-end gap-1">
          <Clock size={12} />
        </span>
      </div>

      <div className="flex flex-col">
        {tracks.map((track, index) => {
          const isCurrent = currentTrack?.path === track.path;
          const isSelected = selectedPaths.has(track.path);
          return (
            <div
              key={`${playlistId ?? "library"}-${track.path}`}
              onClick={() => handlePlayTrack(track, queueSource.findIndex((item) => item.path === track.path))}
              className={cn(
                "grid grid-cols-[auto_auto_1fr_1fr_auto] gap-4 px-4 py-2.5 items-center cursor-pointer transition-colors duration-150 group rounded-lg mx-1",
                isCurrent ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              )}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (playlistId) {
                    removeTrackFromPlaylist(playlistId, track.path);
                  } else {
                    toggleSelected(track.path);
                  }
                }}
                className="w-5 text-white/35 hover:text-white/75 transition-colors"
                title={playlistId ? "从歌单移除" : "选择"}
              >
                {playlistId ? (
                  <Trash2 size={14} />
                ) : isSelected ? (
                  <CheckSquare size={15} className="text-apple-accent" />
                ) : (
                  <Square size={15} />
                )}
              </button>

              <span className="w-8 text-center text-sm text-white/40 group-hover:text-white/60">
                {isCurrent ? (
                  <div className="flex items-center justify-center gap-0.5">
                    <div className="w-[3px] h-3 bg-apple-accent animate-[bounce_1s_infinite]" />
                    <div className="w-[3px] h-4 bg-apple-accent animate-[bounce_1s_infinite_0.1s]" />
                    <div className="w-[3px] h-2 bg-apple-accent animate-[bounce_1s_infinite_0.2s]" />
                  </div>
                ) : (
                  <span className="group-hover:hidden">{index + 1}</span>
                )}
                {!isCurrent && (
                  <Play size={14} className="hidden group-hover:block mx-auto text-white/70" fill="currentColor" />
                )}
              </span>

              <div className="flex flex-col min-w-0">
                <span
                  className={cn(
                    "text-sm truncate",
                    isCurrent ? "text-apple-accent" : "text-white/90"
                  )}
                >
                  {track.title}
                </span>
                <span className="text-xs text-white/40 truncate">{track.artist}</span>
              </div>

              <span className="hidden md:block text-sm text-white/40 truncate">{track.album}</span>

              <span className="w-16 text-right text-xs text-white/40">{formatTime(track.duration)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
