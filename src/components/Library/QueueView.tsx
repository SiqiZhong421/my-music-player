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
  const history = usePlayerStore((s) => s.history);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const playTrackAt = usePlayerStore((s) => s.playTrackAt);
  const { playTrack } = useAudioPlayer();
  const searchQuery = useLibraryStore((s) => s.searchQuery);

  const hasSearch = searchQuery.trim().length > 0;

  // Build display sections: played tracks (faded) → current → upcoming
  const { playedEntries, currentEntry, upcomingEntries } = useMemo(() => {
    if (hasSearch) {
      const q = searchQuery.toLowerCase();
      const filtered = queue
        .map((t, i) => ({ track: t, realIndex: i }))
        .filter(
          ({ track }) =>
            track.title.toLowerCase().includes(q) ||
            track.artist.toLowerCase().includes(q) ||
            track.album.toLowerCase().includes(q)
        );
      // In search mode, don't split into sections, just show all
      return { playedEntries: [], currentEntry: null, upcomingEntries: filtered };
    }

    if (shuffle && shuffledOrder.length > 0) {
      // Show history tracks (played), then current, then upcoming
      const played: { track: (typeof queue)[0]; realIndex: number }[] = [];
      const seenHistory = new Set<number>();
      for (let i = history.length - 1; i >= 0; i--) {
        const idx = history[i];
        if (!seenHistory.has(idx) && idx >= 0 && idx < queue.length) {
          seenHistory.add(idx);
          played.push({ track: queue[idx], realIndex: idx });
        }
      }

      const upcoming: { track: (typeof queue)[0]; realIndex: number }[] = [];
      for (let i = shuffledPosition + 1; i < shuffledOrder.length; i++) {
        const idx = shuffledOrder[i];
        if (idx >= 0 && idx < queue.length && !seenHistory.has(idx)) {
          upcoming.push({ track: queue[idx], realIndex: idx });
        }
      }

      return {
        playedEntries: played,
        currentEntry: queueIndex >= 0 && queueIndex < queue.length
          ? { track: queue[queueIndex], realIndex: queueIndex }
          : null,
        upcomingEntries: upcoming,
      };
    }

    // Non-shuffle mode
    const played = queue.slice(0, queueIndex).map((t, i) => ({ track: t, realIndex: i }));
    const current = queueIndex >= 0 && queueIndex < queue.length
      ? { track: queue[queueIndex], realIndex: queueIndex }
      : null;
    const upcoming = queue.slice(queueIndex + 1).map((t, i) => ({ track: t, realIndex: queueIndex + 1 + i }));

    return { playedEntries: played, currentEntry: current, upcomingEntries: upcoming };
  }, [queue, queueIndex, shuffle, shuffledOrder, shuffledPosition, history, hasSearch, searchQuery]);

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

  const allEntries = hasSearch
    ? upcomingEntries
    : [...playedEntries, ...(currentEntry ? [currentEntry] : []), ...upcomingEntries];

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/30">
        <p>没有匹配的歌曲</p>
      </div>
    );
  }

  const renderRow = (
    { track, realIndex }: { track: (typeof queue)[0]; realIndex: number },
    isCurrent: boolean,
    isPlayed: boolean
  ) => (
    <div
      key={`queue-${track.path}-${realIndex}`}
      onClick={() => handlePlayTrack(realIndex)}
      className={cn(
        "grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2.5 items-center cursor-pointer transition-colors duration-150 group rounded-lg mx-1",
        isCurrent ? "bg-white/[0.08]" : isPlayed ? "hover:bg-white/[0.02]" : "hover:bg-white/[0.04]"
      )}
    >
      <button
        onClick={(e) => handleRemove(e, realIndex)}
        className={cn(
          "w-5 transition-colors",
          isPlayed ? "text-white/10 group-hover:text-red-400/60" : "text-white/20 group-hover:text-red-400"
        )}
        title="从队列移除"
      >
        <Trash2 size={14} />
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
        {hasSearch
          ? upcomingEntries.map((entry) => renderRow(entry, entry.realIndex === queueIndex, false))
          : <>
              {playedEntries.map((entry) => renderRow(entry, false, true))}
              {currentEntry && renderRow(currentEntry, true, false)}
              {upcomingEntries.map((entry) => renderRow(entry, false, false))}
            </>
        }
      </div>
    </div>
  );
}
