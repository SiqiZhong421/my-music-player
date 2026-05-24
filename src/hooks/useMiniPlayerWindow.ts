import { useCallback } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize, LogicalPosition, currentMonitor } from "@tauri-apps/api/window";
import { usePlayerStore } from "@/store/playerStore";

const MINI_WIDTH = 360;
const MINI_HEIGHT = 640;
const MARGIN = 16;

const BOUNDS_KEY = "music-player:window-bounds";

interface SavedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function saveBounds(bounds: SavedBounds): void {
  try {
    localStorage.setItem(BOUNDS_KEY, JSON.stringify(bounds));
  } catch {}
}

function loadBounds(): SavedBounds | null {
  try {
    const raw = localStorage.getItem(BOUNDS_KEY);
    return raw ? (JSON.parse(raw) as SavedBounds) : null;
  } catch {
    return null;
  }
}

export function useMiniPlayerWindow() {
  const setIsMiniPlayer = usePlayerStore((s) => s.setIsMiniPlayer);

  const enterMiniPlayer = useCallback(async () => {
    const appWindow = getCurrentWebviewWindow();

    try {
      const pos = await appWindow.outerPosition();
      const size = await appWindow.outerSize();
      saveBounds({ x: pos.x, y: pos.y, width: size.width, height: size.height });
    } catch {}

    setIsMiniPlayer(true);

    await appWindow.setSize(new LogicalSize(MINI_WIDTH, MINI_HEIGHT));

    try {
      const monitor = await currentMonitor();
      if (monitor) {
        const sf = monitor.scaleFactor;
        const x = monitor.position.x / sf + monitor.size.width / sf - MINI_WIDTH - MARGIN;
        const y = monitor.position.y / sf + monitor.size.height / sf - MINI_HEIGHT - MARGIN;
        await appWindow.setPosition(new LogicalPosition(Math.round(x), Math.round(y)));
      }
    } catch {}

    await appWindow.setAlwaysOnTop(true);
    await appWindow.setDecorations(false);
    await appWindow.setResizable(false);
  }, [setIsMiniPlayer]);

  const exitMiniPlayer = useCallback(async () => {
    const appWindow = getCurrentWebviewWindow();
    const saved = loadBounds();

    setIsMiniPlayer(false);

    await appWindow.setDecorations(true);
    await appWindow.setAlwaysOnTop(false);

    if (saved) {
      await appWindow.setSize(
        new LogicalSize(Math.max(saved.width, 900), Math.max(saved.height, 600))
      );
    } else {
      await appWindow.setSize(new LogicalSize(1200, 800));
    }

    await appWindow.setResizable(true);
    await appWindow.setMinSize(new LogicalSize(900, 600));
    await appWindow.center();
    await appWindow.setFocus();
  }, [setIsMiniPlayer]);

  return { enterMiniPlayer, exitMiniPlayer };
}
