import { Disc3 } from "lucide-react";
import { cn } from "@/utils/cn";

interface AlbumArtProps {
  coverArt: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  isPlaying?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-12 h-12 rounded-lg",
  md: "w-20 h-20 rounded-xl",
  lg: "w-48 h-48 rounded-2xl",
  xl: "w-72 h-72 rounded-3xl",
};

export function AlbumArt({ coverArt, size = "md", isPlaying = false, className }: AlbumArtProps) {
  if (coverArt) {
    return (
      <div className={cn("relative overflow-hidden shadow-2xl shadow-black/50", sizeMap[size], className)}>
        <img
          src={coverArt}
          alt="Album Art"
          className={cn(
            "w-full h-full object-cover transition-transform duration-700",
            isPlaying && "scale-105"
          )}
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-inherit" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 shadow-2xl shadow-black/50",
        sizeMap[size],
        className
      )}
    >
      <Disc3
        className={cn(
          "text-white/30",
          size === "sm" && "w-6 h-6",
          size === "md" && "w-10 h-10",
          size === "lg" && "w-24 h-24",
          size === "xl" && "w-32 h-32",
          isPlaying && "animate-spin-slow"
        )}
        strokeWidth={1}
      />
    </div>
  );
}
