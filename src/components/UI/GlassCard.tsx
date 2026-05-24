import { forwardRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = false, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20",
          hover && "transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5",
          onClick && "cursor-pointer",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
