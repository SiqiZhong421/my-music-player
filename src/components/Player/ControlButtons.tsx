import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/utils/cn";

interface ControlButtonsProps {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  size?: "sm" | "md";
}

export function ControlButtons({ onTogglePlay, onNext, onPrev, size = "md" }: ControlButtonsProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const hasTrack = usePlayerStore((s) => !!s.currentTrack);

  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const playSize = size === "sm" ? "w-10 h-10" : "w-14 h-14";
  const iconSize = size === "sm" ? 16 : 20;
  const playIconSize = size === "sm" ? 20 : 24;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggleShuffle}
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-200",
          btnSize,
          shuffle
            ? "text-apple-accent bg-apple-accent/10"
            : "text-white/50 hover:text-white/80 hover:bg-white/5"
        )}
        title="随机播放"
      >
        <Shuffle size={iconSize} />
      </button>

      <button
        onClick={onPrev}
        disabled={!hasTrack}
        className={cn(
          "flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
          btnSize
        )}
      >
        <SkipBack size={iconSize} fill="currentColor" className="opacity-80" />
      </button>

      <button
        onClick={onTogglePlay}
        className={cn(
          "flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-black/20",
          playSize
        )}
      >
        {isPlaying ? (
          <Pause size={playIconSize} fill="currentColor" />
        ) : (
          <Play size={playIconSize} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <button
        onClick={onNext}
        disabled={!hasTrack}
        className={cn(
          "flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
          btnSize
        )}
      >
        <SkipForward size={iconSize} fill="currentColor" className="opacity-80" />
      </button>

      <button
        onClick={toggleRepeat}
        className={cn(
          "flex items-center justify-center rounded-full text-apple-accent bg-apple-accent/10 hover:bg-apple-accent/15 transition-all duration-200",
          btnSize
        )}
        title={repeatMode === "one" ? "单曲循环" : "列表循环"}
      >
        {repeatMode === "one" ? (
          <Repeat1 size={iconSize} />
        ) : (
          <Repeat size={iconSize} />
        )}
      </button>
    </div>
  );
}
