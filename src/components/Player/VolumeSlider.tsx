import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/utils/cn";

export function VolumeSlider() {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const [isDragging, setIsDragging] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const barRef = useRef<HTMLDivElement>(null);

  const calculateVolume = useCallback(
    (clientX: number) => {
      if (!barRef.current) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return x / rect.width;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setVolume(calculateVolume(e.clientX));
    },
    [calculateVolume, setVolume]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setVolume(calculateVolume(e.clientX));
      }
    },
    [isDragging, calculateVolume, setVolume]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
    } else {
      setVolume(previousVolume || 0.7);
    }
  }, [volume, previousVolume, setVolume]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={toggleMute}
        className="text-white/50 hover:text-white/80 transition-colors p-1"
      >
        <VolumeIcon size={18} />
      </button>

      <div
        ref={barRef}
        className="relative w-24 h-5 flex items-center cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/60 transition-all duration-75"
            style={{ width: `${volume * 100}%` }}
          />
        </div>

        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md transform -translate-x-1/2 transition-opacity",
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          style={{ left: `${volume * 100}%` }}
        />
      </div>
    </div>
  );
}
