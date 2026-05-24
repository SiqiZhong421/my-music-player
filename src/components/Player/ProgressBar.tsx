import { useRef, useState, useCallback } from "react";
import { formatTime } from "@/utils/formatTime";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/utils/cn";

interface ProgressBarProps {
  onSeek: (time: number) => void;
  compact?: boolean;
}

export function ProgressBar({ onSeek, compact = false }: ProgressBarProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const calculateTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * duration;
    },
    [duration]
  );

  const handleInteraction = useCallback(
    (clientX: number) => {
      const time = calculateTimeFromPosition(clientX);
      onSeek(time);
    },
    [calculateTimeFromPosition, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleInteraction(e.clientX);
    },
    [handleInteraction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientX);
      }
      setHoverTime(calculateTimeFromPosition(e.clientX));
    },
    [isDragging, handleInteraction, calculateTimeFromPosition]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className={cn("group w-full select-none", compact ? "gap-2" : "flex flex-col gap-1.5")}
      onMouseUp={handleMouseUp}
    >
      {!compact && (
        <div className="flex justify-between text-[11px] font-medium tracking-wide text-white/40">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}

      <div
        ref={barRef}
        className="relative w-full cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Track background */}
        <div className="h-1 w-full rounded-full bg-[--slider-track] overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full rounded-full bg-[--slider-fill] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Hover tooltip */}
        {hoverTime !== null && !isDragging && (
          <div
            className="absolute -top-7 text-[10px] font-medium text-white/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none transform -translate-x-1/2"
            style={{
              left: `${duration > 0 ? (hoverTime / duration) * 100 : 0}%`,
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[--slider-thumb] shadow-lg shadow-black/30 transform -translate-x-1/2 transition-opacity",
            isDragging || hoverTime !== null ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
          )}
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
}
