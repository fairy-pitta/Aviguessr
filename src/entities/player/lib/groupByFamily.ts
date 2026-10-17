import type { LifeListEntry } from "../api/playerApi";

export type FamilyGroup = {
  family: string;
  entries: LifeListEntry[];
};

/** Where a bird with no family recorded is filed. */
export const UNPLACED = "Unplaced";

/**
 * The list as a guide sets one out: by family, families in alphabetical
 * order, birds alphabetical within each.
 *
 * Grouping is the point rather than decoration. A life list sorted only by
 * name says nothing; sorted by family it shows the player which branches of
 * the tree they have covered and which they have never met at all — which is
 * the same knowledge the family hint sells them one bird at a time.
 */
export function groupByFamily(entries: LifeListEntry[]): FamilyGroup[] {
  const groups = new Map<string, LifeListEntry[]>();

  for (const entry of entries) {
    const family = entry.family ?? UNPLACED;
    const existing = groups.get(family);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(family, [entry]);
    }
  }

  return [...groups.entries()]
    .map(([family, rows]) => ({
      family,
      entries: [...rows].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      // Birds the taxonomy could not place belong at the end, not under U
      if (a.family === UNPLACED) return 1;
      if (b.family === UNPLACED) return -1;
      return a.family.localeCompare(b.family);
    });
}
