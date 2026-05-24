import { useState, useEffect, useRef } from "react";
import { Disc, List, ListMusic, Mic2, Plus, Search, X } from "lucide-react";
import { useLibraryStore } from "@/store/libraryStore";
import { FolderPicker } from "@/components/Library/FolderPicker";
import { cn } from "@/utils/cn";

const navItems = [
  { id: "tracks" as const, label: "歌曲", icon: ListMusic },
  { id: "albums" as const, label: "专辑", icon: Disc },
  { id: "artists" as const, label: "艺人", icon: Mic2 },
  { id: "queue" as const, label: "播放队列", icon: List },
];

export function Sidebar() {
  const currentView = useLibraryStore((s) => s.currentView);
  const selectedPlaylistId = useLibraryStore((s) => s.selectedPlaylistId);
  const setCurrentView = useLibraryStore((s) => s.setCurrentView);
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const setSelectedPlaylist = useLibraryStore((s) => s.setSelectedPlaylist);
  const tracks = useLibraryStore((s) => s.tracks);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);

  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 200);
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchQuery("");
  };

  const handleCreatePlaylist = () => {
    const name = window.prompt("歌单名称");
    if (!name?.trim()) return;
    createPlaylist(name);
  };

  return (
    <div className="w-56 flex flex-col h-full border-r border-white/[0.06] bg-black/20">
      <div className="flex items-center gap-2 px-5 py-5">
        <img src="/avatar.jpg" alt="Maiki's Player" className="w-8 h-8 rounded-lg object-cover" />
        <span className="text-sm font-semibold text-white">Maiki's Player</span>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="搜索"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.06] rounded-lg pl-8 pr-8 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
          />
          {inputValue && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-2 mb-2">
            资料库
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  currentView === item.id
                    ? "bg-white/[0.08] text-white font-medium"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              歌单
            </span>
            <button
              onClick={handleCreatePlaylist}
              className="p-1 rounded-md text-white/35 hover:text-white/80 hover:bg-white/[0.05] transition-colors"
              title="新建歌单"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-0.5">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                  currentView === "playlist" && selectedPlaylistId === playlist.id
                    ? "bg-white/[0.08] text-white font-medium"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                <ListMusic size={17} />
                <span className="truncate">{playlist.name}</span>
              </button>
            ))}
            {playlists.length === 0 && (
              <p className="px-3 text-xs text-white/25">暂无歌单</p>
            )}
          </div>
        </div>
      </nav>

      {tracks.length > 0 && (
        <div className="px-5 py-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/30">
            {tracks.length} 首歌曲
          </p>
        </div>
      )}

      <div className="px-3 py-3 border-t border-white/[0.06]">
        <FolderPicker />
      </div>
    </div>
  );
}
