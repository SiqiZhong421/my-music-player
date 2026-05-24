import { FolderOpen, Loader2 } from "lucide-react";
import { useLibrary } from "@/hooks/useLibrary";
import { useLibraryStore } from "@/store/libraryStore";
import { cn } from "@/utils/cn";

export function FolderPicker() {
  const { importFolderFromDialog } = useLibrary();
  const isScanning = useLibraryStore((s) => s.isScanning);
  const selectedFolder = useLibraryStore((s) => s.selectedFolder);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={importFolderFromDialog}
        disabled={isScanning}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white",
          "border border-white/[0.06] hover:border-white/[0.12]",
          isScanning && "opacity-60 cursor-wait"
        )}
      >
        {isScanning ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FolderOpen size={16} />
        )}
        <span>{isScanning ? "导入中..." : "导入音乐文件夹"}</span>
      </button>

      {selectedFolder && (
        <p className="text-[10px] text-white/30 truncate px-1" title={selectedFolder}>
          {selectedFolder}
        </p>
      )}
    </div>
  );
}
