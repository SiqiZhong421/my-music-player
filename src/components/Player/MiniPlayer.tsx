import { useMemo, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize2, Sun, Moon, GripHorizontal } from "lucide-react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { usePlayerStore } from "@/store/playerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useMiniPlayerWindow } from "@/hooks/useMiniPlayerWindow";
import { useLyrics } from "@/hooks/useLyrics";
import { AlbumArt } from "@/components/Player/AlbumArt";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/formatTime";

export function MiniPlayer() {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const theme = usePlayerStore((s) => s.theme);
  const toggleTheme = usePlayerStore((s) => s.toggleTheme);
  const { seek, togglePlay, skipNext, skipPrev } = useAudioPlayer();
  const { exitMiniPlayer } = useMiniPlayerWindow();
  const { lyrics, currentLineIndex, hasLrcFile, currentLineRef } = useLyrics();

  const title = current?.title ?? "未播放";
  const artist = current?.artist ?? "";
  const needsMarquee = title.length > 15;
  const progressPercent = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  const isLight = theme === "light";

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".no-drag")) return;
    getCurrentWebviewWindow().startDragging();
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      seek(Math.max(0, Math.min(1, ratio)) * duration);
    },
    [duration, seek]
  );

  // Light mode override classes
  const btnText = isLight ? "text-black/55 hover:text-black/80" : "text-white/50 hover:text-white/80";
  const btnBg = isLight ? "hover:bg-black/5" : "hover:bg-white/10";
  const playBtnBg = isLight ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20";
  const playBtnText = isLight ? "text-black" : "text-white";
  const sliderTrack = isLight ? "bg-black/15" : "bg-white/[0.08]";
  const sliderThumb = isLight ? "[&::-webkit-slider-thumb]:bg-black/60" : "[&::-webkit-slider-thumb]:bg-white";
  const progressFill = isLight ? "bg-black/50" : "bg-white/60";
  const mutedText = isLight ? "text-black/30" : "text-white/25";
  const headerBtn = isLight ? "text-black/35 hover:text-black/70" : "text-white/40 hover:text-white/80";

  return (
    <div
      onMouseDown={handleDragStart}
      className={`relative h-screen overflow-hidden select-none flex flex-col cursor-grab ${isLight ? "light" : ""}`}
    >
      {/* Frosted glass background */}
      {current?.coverArt && (
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-center scale-110 blur-[40px]",
            isLight ? "brightness-[0.85]" : "brightness-[0.2]"
          )}
          style={{ backgroundImage: `url(${current.coverArt})` }}
        />
      )}
      <div className={cn("absolute inset-0", isLight ? "bg-white/85" : "bg-black/50")} />

      {/* Header bar */}
      <div className="relative z-20 flex items-center justify-between h-10 px-3 shrink-0">
        <GripHorizontal size={14} className={mutedText} />
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={toggleTheme}
            className={cn("p-1.5 rounded-full transition-colors", headerBtn, isLight ? "hover:bg-black/5" : "hover:bg-white/10")}
            title={isLight ? "深色模式" : "浅色模式"}
          >
            {isLight ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <button
            onClick={exitMiniPlayer}
            className={cn("p-1.5 rounded-full transition-colors", headerBtn, isLight ? "hover:bg-black/5" : "hover:bg-white/10")}
            title={"恢复窗口"}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 px-4 pb-3 gap-3">
        {/* Album Art + Track Info */}
        <div className="flex items-center gap-3 shrink-0">
          <AlbumArt
            coverArt={current?.coverArt ?? null}
            size="sm"
            isPlaying={isPlaying}
            className="shadow-lg shadow-black/40 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden whitespace-nowrap">
              <span
                className={cn(
                  "inline-block text-sm font-medium text-white",
                  needsMarquee && "animate-marquee"
                )}
              >
                {needsMarquee ? `${title}    ${title}    ` : title}
              </span>
            </div>
            <p className="text-xs text-white/50 truncate">{artist}</p>
          </div>
        </div>

        {/* Lyrics area */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          {current && hasLrcFile && lyrics.length > 0 ? (
            <div className="h-full overflow-y-auto py-2 px-1 no-drag">
              <div className="flex flex-col gap-4">
                {lyrics.map((line, index) => (
                  <div
                    key={index}
                    ref={index === currentLineIndex ? currentLineRef : null}
                    className={cn(
                      "transition-all duration-500 leading-relaxed",
                      index === currentLineIndex
                        ? "text-white text-lg font-semibold"
                        : index === currentLineIndex + 1 || index === currentLineIndex - 1
                          ? "text-white/50 text-base"
                          : "text-white/30 text-sm"
                    )}
                  >
                    {line.text || "· · ·"}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white/30 text-sm">
              {current ? "暂无歌词" : "未在播放"}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2 shrink-0">
          <span className={cn("text-[10px] w-8 text-right tabular-nums", isLight ? "text-black/35" : "text-white/40")}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleSeek}
            className={cn("flex-1 h-1 rounded-full overflow-hidden cursor-pointer no-drag", sliderTrack)}
          >
            <div
              className={cn("h-full rounded-full transition-all duration-100", progressFill)}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={cn("text-[10px] w-8 tabular-nums", isLight ? "text-black/35" : "text-white/40")}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="no-drag flex items-center justify-center gap-2 shrink-0">
          <button
            onClick={skipPrev}
            disabled={!current}
            className={cn(
              "p-2 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors",
              btnText, btnBg
            )}
          >
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className={cn("p-3 rounded-full transition-colors", playBtnText, playBtnBg)}
          >
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button
            onClick={skipNext}
            disabled={!current}
            className={cn(
              "p-2 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors",
              btnText, btnBg
            )}
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-1 ml-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className={cn(
                "w-16 h-1 rounded-full appearance-none cursor-pointer",
                sliderTrack,
                sliderThumb,
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:w-2.5",
                "[&::-webkit-slider-thumb]:h-2.5",
                "[&::-webkit-slider-thumb]:rounded-full"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
