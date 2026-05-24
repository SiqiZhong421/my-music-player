import { Play, Trash2, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn } from "@/utils/cn";
import type { Track } from "@/types";

export function QueueView() {
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const playTrackAt = usePlayerStore((s) => s.playTrackAt);
  const { playTrack } = useAudioPlayer();

  const handlePlayTrack = (track: Track, index: number) => {
    playTrackAt(index);
    playTrack(track, true);
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    removeFromQueue(index);
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

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/[0.06]">
        <span className="w-8 text-center">#</span>
        <span>标题</span>
        <span className="hidden md:block">专辑</span>
        <span className="w-10 text-right" />
      </div>

      <div className="flex flex-col">
        {queue.map((track, index) => {
          const isCurrent = queueIndex === index;
          return (
            <div
              key={`queue-${track.path}-${index}`}
              onClick={() => handlePlayTrack(track, index)}
              className={cn(
                "grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 items-center cursor-pointer transition-colors duration-150 group rounded-lg mx-1",
                isCurrent ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              )}
            >
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

              <button
                onClick={(e) => handleRemove(e, index)}
                className="w-10 text-right text-white/30 hover:text-red-400 transition-colors"
                title="从队列移除"
              >
                <Trash2 size={14} className="ml-auto" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
