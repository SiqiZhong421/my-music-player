import { useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MainContent } from "@/components/Layout/MainContent";
import { PlayerBar } from "@/components/Layout/PlayerBar";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useLibrary } from "@/hooks/useLibrary";
import { usePlayerStore } from "@/store/playerStore";

function App() {
  useAudioPlayer();
  const { importLastFolder } = useLibrary();
  const theme = usePlayerStore((s) => s.theme);

  const { togglePlay, skipNext, skipPrev } = useAudioPlayer();
  const handlersRef = useRef({ togglePlay, skipNext, skipPrev });
  handlersRef.current = { togglePlay, skipNext, skipPrev };

  useEffect(() => {
    const timer = setTimeout(() => importLastFolder(), 0);
    return () => clearTimeout(timer);
  }, [importLastFolder]);

  // Sync native title bar theme
  useEffect(() => {
    const appWindow = getCurrentWebviewWindow();
    appWindow.setTheme(theme).catch(() => {});
  }, [theme]);

  // Media keys and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        handlersRef.current.togglePlay();
        return;
      }

      if (e.code === "MediaPlayPause") {
        e.preventDefault();
        handlersRef.current.togglePlay();
        return;
      }
      if (e.code === "MediaTrackNext") {
        e.preventDefault();
        handlersRef.current.skipNext();
        return;
      }
      if (e.code === "MediaTrackPrevious") {
        e.preventDefault();
        handlersRef.current.skipPrev();
        return;
      }

      // Ctrl/Cmd + Arrow
      if ((e.ctrlKey || e.metaKey) && e.code === "ArrowRight") {
        e.preventDefault();
        handlersRef.current.skipNext();
      } else if ((e.ctrlKey || e.metaKey) && e.code === "ArrowLeft") {
        e.preventDefault();
        handlersRef.current.skipPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Media Session API for OS media controls
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => handlersRef.current.togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => handlersRef.current.togglePlay());
      navigator.mediaSession.setActionHandler("previoustrack", () => handlersRef.current.skipPrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => handlersRef.current.skipNext());
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={`flex flex-col h-screen bg-apple-bg text-white overflow-hidden select-none ${theme === "light" ? "light" : ""}`}>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <MainContent />
      </div>
      <PlayerBar />
    </div>
  );
}

export default App;
