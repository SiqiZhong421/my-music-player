import { ChevronDown } from "lucide-react";
import { AlbumArt } from "./AlbumArt";
import { ControlButtons } from "./ControlButtons";
import { ProgressBar } from "./ProgressBar";
import { VolumeSlider } from "./VolumeSlider";
import { LyricsScroller } from "./LyricsScroller";
import { usePlayerStore } from "@/store/playerStore";
import { useLibraryStore } from "@/store/libraryStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

export function NowPlaying() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrentView = useLibraryStore((s) => s.setCurrentView);
  const { seek, togglePlay, skipNext, skipPrev } = useAudioPlayer();

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30">
        <p className="text-lg">未在播放</p>
        <p className="text-sm mt-2">从资料库选择一首歌曲</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => setCurrentView("tracks")}
          className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <ChevronDown size={18} />
          <span>收起</span>
        </button>
        <span className="text-xs font-medium text-white/30 uppercase tracking-widest">正在播放</span>
        <div className="w-16" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Album art + info + controls */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 gap-6">
          <AlbumArt
            coverArt={currentTrack.coverArt}
            size="xl"
            isPlaying={isPlaying}
            className="shadow-2xl shadow-black/60"
          />

          <div className="text-center space-y-1 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-white truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-white/50 truncate">
              {currentTrack.artist} — {currentTrack.album}
            </p>
          </div>

          <div className="w-full max-w-md space-y-4">
            <ProgressBar onSeek={seek} />
            <div className="flex items-center justify-between">
              <div className="w-24" />
              <ControlButtons
                onTogglePlay={togglePlay}
                onNext={skipNext}
                onPrev={skipPrev}
              />
              <div className="w-24 flex justify-end">
                <VolumeSlider />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lyrics */}
        <div className="w-[400px] border-l border-white/[0.06] hidden lg:block">
          <LyricsScroller />
        </div>
      </div>
    </div>
  );
}
