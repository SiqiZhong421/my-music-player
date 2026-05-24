import type { LyricLine } from "@/types";

export function parseLrc(lrcContent: string): LyricLine[] {
  if (!lrcContent) return [];

  const lines = lrcContent.split("\n");
  const lyrics: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Extract all time tags in this line (some lines have multiple tags)
    const timeMatches = [...trimmed.matchAll(timeRegex)];
    if (timeMatches.length === 0) continue;

    // Get the text after the last time tag
    const lastMatchEnd = timeMatches[timeMatches.length - 1].index! + timeMatches[timeMatches.length - 1][0].length;
    const text = trimmed.slice(lastMatchEnd).trim();

    for (const match of timeMatches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millisecondsStr = match[3];
      const milliseconds =
        millisecondsStr.length === 2
          ? parseInt(millisecondsStr, 10) * 10
          : parseInt(millisecondsStr, 10);

      const time = minutes * 60 + seconds + milliseconds / 1000;
      lyrics.push({ time, text });
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
}

export function findCurrentLyricIndex(
  lyrics: LyricLine[],
  currentTime: number
): number {
  if (lyrics.length === 0) return -1;

  let left = 0;
  let right = lyrics.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (lyrics[mid].time <= currentTime) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return right;
}
