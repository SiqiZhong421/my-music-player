import { Converter } from "opencc-js";
import type { Track } from "@/types";

const toSimplified = Converter({ from: "tw", to: "cn" });

function normalizeKey(title: string): string {
  try {
    return toSimplified(title).toLowerCase().trim();
  } catch {
    return title.toLowerCase().trim();
  }
}

export function deduplicateTrackTitles(tracks: Track[]): Track[] {
  const groups = new Map<string, Track[]>();

  for (const track of tracks) {
    const key = normalizeKey(track.title);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(track);
  }

  const result: Track[] = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      group.forEach((track, i) => {
        result.push({
          ...track,
          title: `${track.title} (${i + 1})`,
        });
      });
    }
  }

  return result;
}
