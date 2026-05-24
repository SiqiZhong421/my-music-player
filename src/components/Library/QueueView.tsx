import { useMemo } from "react";
import { Clock, Trash2, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/formatTime";

export function QueueView() {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const shuffledOrder = usePlayerStore((s) => s.shuffledOrder);
  const shuffledPosition = usePlayerStore((s) => s.shuffledPosition);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const playTrackAt = usePlayerStore((s) => s.playTrackAt);
  const { playTrack } = useAudioPlayer();
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  // Build display order: when shuffle is on and no search filter, show shuffled order
  const displayEntries = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;

    if (hasSearch) {
      // Search mode: show filtered results with their real queue indices
      const q = searchQuery.toLowerCase();
      return queue
        .map((t, i) => ({ track: t, realIndex: i, shuffledPos: -1 }))
        .filter(
          ({ track }) =>
            track.title.toLowerCase().includes(q) ||
            track.artist.toLowerCase().includes(q) ||
            track.album.toLowerCase().includes(q)
        );
    }

    if (shuffle && shuffledOrder.length > 0) {
      // Shuffle mode: show tracks in shuffled order
      return shuffledOrder.map((realIndex, pos) => ({
        track: queue[realIndex],
        realIndex,
        shuffledPos: pos,
      }));
    }

    // Normal mode: show queue in order
    return queue.map((t, i) => ({ track: t, realIndex: i, shuffledPos: -1 }));
  }, [queue, shuffle, shuffledOrder, searchQuery]);

  const currentDisplayIndex = useMemo(() => {
    if (shuffle && shuffledOrder.length > 0 && !searchQuery.trim()) {
      return shuffledPosition;
    }
    return queueIndex;
  }, [shuffle, shuffledOrder, shuffledPosition, queueIndex, searchQuery]);

  const handlePlayTrack = (realIndex: number) => {
    playTrackAt(realIndex);
    playTrack(queue[realIndex], true);
  };

  const handleRemove = (e: React.MouseEvent, realIndex: number) => {
    e.stopPropagation();
    removeFromQueue(realIndex);
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <ListMusic size={48} strokeWidth={1} className="mb-4" />
        <p>播放队列为空</p>
        <p className="text-sm mt-1">从资料库选择歌曲开始播放</p>
      </div>
    );
  }

  if (displayEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <p>没有匹配的歌曲</p>
      </div>
    );
  }

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
        {displayEntries.map(({ track, realIndex, shuffledPos }) => {
          const isCurrent = shuffle && !searchQuery.trim() && shuffledPos >= 0
            ? shuffledPos === currentDisplayIndex
            : realIndex === queueIndex;
          return (
            <div
              key={`queue-${track.path}-${realIndex}`}
              onClick={() => handlePlayTrack(realIndex)}
              className={cn(
                "grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2.5 items-center cursor-pointer transition-colors duration-150 group rounded-lg mx-1",
                isCurrent ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              )}
            >
              <button
                onClick={(e) => handleRemove(e, realIndex)}
                className="w-5 text-white/20 group-hover:text-red-400 transition-colors"
                title="从队列移除"
              >
                <Trash2 size={14} />
              </button>

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
