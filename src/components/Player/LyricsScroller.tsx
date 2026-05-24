import { Music } from "lucide-react";
import { useLyrics } from "@/hooks/useLyrics";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/utils/cn";

export function LyricsScroller() {
  const current = usePlayerStore((s) => s.current);
  const { lyrics, currentLineIndex, hasLrcFile, loading, currentLineRef } = useLyrics();

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30">
        <Music size={48} strokeWidth={1} className="mb-4" />
        <p className="text-sm">选择一首歌曲开始播放</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasLrcFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30">
        <Music size={48} strokeWidth={1} className="mb-4" />
        <p className="text-sm">暂无歌词</p>
        <p className="text-xs mt-1 opacity-60">放置同名的 .lrc 文件到歌曲目录</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-4 py-8">
      <div className="flex flex-col items-center gap-4 min-h-full justify-center">
        {lyrics.map((line, index) => (
          <div
            key={index}
            ref={index === currentLineIndex ? currentLineRef : null}
            className={cn(
              "text-center transition-all duration-500 px-4 py-1.5 rounded-lg max-w-md",
              index === currentLineIndex
                ? "text-white text-lg font-medium scale-105"
                : index === currentLineIndex - 1 || index === currentLineIndex + 1
                ? "text-white/50 text-base"
                : "text-white/25 text-sm"
            )}
          >
            {line.text || "· · ·"}
          </div>
        ))}
      </div>
    </div>
  );
}
