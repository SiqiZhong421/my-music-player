import { Captions, Sun, Moon } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AlbumArt } from "@/components/Player/AlbumArt";
import { ControlButtons } from "@/components/Player/ControlButtons";
import { ProgressBar } from "@/components/Player/ProgressBar";
import { VolumeSlider } from "@/components/Player/VolumeSlider";
import { cn } from "@/utils/cn";

export function PlayerBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const showLyricsPanel = usePlayerStore((s) => s.showLyricsPanel);
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const theme = usePlayerStore((s) => s.theme);
  const toggleTheme = usePlayerStore((s) => s.toggleTheme);
  const { seek, togglePlay, skipNext, skipPrev } = useAudioPlayer();

  return (
    <div className="h-20 border-t border-white/[0.06] bg-black/40 backdrop-blur-2xl grid grid-cols-[1fr_auto_1fr] items-center px-4">
      <div className="flex items-center gap-3 min-w-0">
        <AlbumArt
          coverArt={currentTrack?.coverArt || null}
          size="sm"
          isPlaying={isPlaying}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentTrack?.title || "未播放"}
          </p>
          <p className="text-xs text-white/40 truncate">{currentTrack?.artist || ""}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center max-w-xl mx-4">
        <ControlButtons
          onTogglePlay={togglePlay}
          onNext={skipNext}
          onPrev={skipPrev}
          size="sm"
        />
        <div className="w-full mt-1">
          <ProgressBar onSeek={seek} compact />
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end min-w-0">
        <VolumeSlider />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
          title={theme === "dark" ? "浅色模式" : "深色模式"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={toggleLyricsPanel}
          className={cn(
            "p-2 rounded-lg transition-all",
            showLyricsPanel
              ? "text-apple-accent bg-apple-accent/10"
              : "text-white/40 hover:text-white/80 hover:bg-white/5",
            !currentTrack && "opacity-30 cursor-not-allowed"
          )}
          disabled={!currentTrack}
          title="歌词"
        >
          <Captions size={16} />
        </button>
      </div>
    </div>
  );
}
