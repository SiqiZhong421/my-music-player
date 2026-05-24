import { useEffect } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MainContent } from "@/components/Layout/MainContent";
import { PlayerBar } from "@/components/Layout/PlayerBar";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useLibrary } from "@/hooks/useLibrary";
import { usePlayerStore } from "@/store/playerStore";

function App() {
  // Initialize audio player
  useAudioPlayer();
  const { importLastFolder } = useLibrary();
  const theme = usePlayerStore((s) => s.theme);

  useEffect(() => {
    // Defer library loading so UI renders first
    const timer = setTimeout(() => {
      importLastFolder();
    }, 0);
    return () => clearTimeout(timer);
  }, [importLastFolder]);

  // Handle media keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        // togglePlay handled by global state
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
