export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const negative = seconds < 0;
  const abs = Math.abs(seconds);
  const mins = Math.floor(abs / 60);
  const secs = Math.floor(abs % 60);
  return `${negative ? "-" : ""}${mins}:${secs.toString().padStart(2, "0")}`;
}

export function parseDuration(duration: number | null | undefined): number {
  if (typeof duration === "number" && isFinite(duration)) {
    return duration;
  }
  return 0;
}
