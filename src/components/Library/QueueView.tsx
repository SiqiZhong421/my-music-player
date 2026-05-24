import { useMemo, useEffect, useRef } from "react";
import { Clock, Trash2, ListMusic, X } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/formatTime";
import type { Track } from "@/types";

function TrackRow({
  track,
  isCurrent,
  isPlayed,
  canRemove,
  onJump,
  onRemove,
  rowRef,
}: {
  track: Track | null;
  isCurrent: boolean;
  isPlayed: boolean;
  canRemove: boolean;
  onJump: () => void;
  onRemove: (e: React.MouseEvent) => void;
  rowRef?: React.Ref<HTMLDivElement>;
}) {
  if (!track) return null;
  return (
    <div
      ref={rowRef}
      onClick={onJump}
      className={cn(
        "grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2.5 items-center cursor-pointer transition-colors duration-150 group rounded-lg mx-1",
        isCurrent ? "bg-white/[0.08]" : isPlayed ? "hover:bg-white/[0.02]" : "hover:bg-white/[0.04]"
      )}
    >
      <button
        onClick={onRemove}
        className={cn(
          "w-5 transition-colors",
          canRemove
            ? isPlayed
              ? "text-white/20 group-hover:text-red-400/60"
              : "text-white/30 group-hover:text-red-400"
            : "text-white/5 cursor-default"
        )}
        title={canRemove ? "从队列移除" : undefined}
        disabled={!canRemove}
      >
        {canRemove && <Trash2 size={14} />}
      </button>

      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "text-sm truncate",
            isCurrent ? "text-apple-accent" : isPlayed ? "text-white/25" : "text-white/90"
          )}
        >
          {track.title}
        </span>
        <span className={cn("text-xs truncate", isPlayed ? "text-white/15" : "text-white/40")}>
          {track.artist}
        </span>
      </div>

      <span className={cn("hidden md:block text-sm truncate", isPlayed ? "text-white/15" : "text-white/40")}>
        {track.album}
      </span>

      <span className={cn("w-16 text-right text-xs", isPlayed ? "text-white/15" : "text-white/40")}>
        {formatTime(track.duration)}
      </span>
    </div>
  );
}

export function QueueView() {
  const current = usePlayerStore((s) => s.current);
  const upcoming = usePlayerStore((s) => s.upcoming);
  const history = usePlayerStore((s) => s.history);
  const jumpTo = usePlayerStore((s) => s.jumpTo);
  const removeFromUpcoming = usePlayerStore((s) => s.removeFromUpcoming);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const { playTrack } = useAudioPlayer();
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  const currentRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current?.path]);

  const hasSearch = searchQuery.trim().length > 0;

  const filteredEntries = useMemo(() => {
    if (!hasSearch) return null;
    const q = searchQuery.toLowerCase();
    const all = [...history, ...(current ? [current] : []), ...upcoming];
    return all
      .map((t, i) => ({ track: t, globalIndex: i }))
      .filter(
        ({ track }) =>
          track.title.toLowerCase().includes(q) ||
          track.artist.toLowerCase().includes(q) ||
          track.album.toLowerCase().includes(q)
      );
  }, [hasSearch, searchQuery, history, current, upcoming]);

  if (!current && upcoming.length === 0 && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <ListMusic size={48} strokeWidth={1} className="mb-4" />
        <p>播放队列为空</p>
        <p className="text-sm mt-1">从资料库选择歌曲开始播放</p>
      </div>
    );
  }

  const handleJump = (track: Track) => {
    jumpTo(track);
    playTrack(track, true);
  };

  const handleRemove = (e: React.MouseEvent, upcomingIndex: number) => {
    e.stopPropagation();
    removeFromUpcoming(upcomingIndex);
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
        <span className="w-5" />
        <span>标题</span>
        <span className="hidden md:block">专辑</span>
        <span className="w-16 text-right flex items-center justify-end gap-1">
          <Clock size={12} />
        </span>
      </div>

      <div className="flex flex-col">
        {filteredEntries
          ? filteredEntries.map(({ track }) => (
              <TrackRow
                key={`search-${track.path}`}
                track={track}
                isCurrent={current?.path === track.path}
                isPlayed={false}
                canRemove={false}
                onJump={() => handleJump(track)}
                onRemove={() => {}}
              />
            ))
          : <>
              {/* History section */}
              {history.map((track, i) => (
                <TrackRow
                  key={`hist-${track.path}-${i}`}
                  track={track}
                  isCurrent={false}
                  isPlayed
                  canRemove={false}
                  onJump={() => handleJump(track)}
                  onRemove={() => {}}
                />
              ))}

              {/* Current track */}
              {current && (
                <TrackRow
                  key={`curr-${current.path}`}
                  track={current}
                  isCurrent
                  isPlayed={false}
                  canRemove={false}
                  onJump={() => handleJump(current)}
                  onRemove={() => {}}
                  rowRef={currentRowRef}
                />
              )}

              {/* Upcoming section */}
              {upcoming.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-white/25 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                  <span>清空播放队列</span>
                </button>
              )}
              {upcoming.map((track, i) => (
                <TrackRow
                  key={`up-${track.path}-${i}`}
                  track={track}
                  isCurrent={false}
                  isPlayed={false}
                  canRemove
                  onJump={() => handleJump(track)}
                  onRemove={(e) => handleRemove(e, i)}
                />
              ))}

              {upcoming.length === 0 && current && (
                <div className="flex flex-col items-center justify-center h-32 text-white/20 text-sm">
                  <p>队列中暂无更多歌曲</p>
                </div>
              )}
            </>
        }
      </div>
    </div>
  );
}
