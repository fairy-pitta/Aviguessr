import { describe, it, expect } from "vitest";
import { groupByFamily, UNPLACED } from "@/entities/player/lib/groupByFamily";
import type { LifeListEntry } from "@/entities/player";

function entry(
  name: string,
  family: string | null,
  overrides: Partial<LifeListEntry> = {}
): LifeListEntry {
  return {
    birdId: name.length,
    name,
    family,
    encounters: 1,
    correct: 1,
    bestScore: 4000,
    lastGuess: "US",
    firstSeenAt: "2026-10-01 10:00:00",
    lastSeenAt: "2026-10-01 10:00:00",
    imageUrl: "/api/birds/1/image",
    ...overrides,
  };
}

describe("groupByFamily", () => {
  it("test_group_by_family_with_no_entries_returns_no_groups", () => {
    expect(groupByFamily([])).toEqual([]);
  });

  it("test_group_by_family_collects_birds_of_one_family_together", () => {
    const groups = groupByFamily([
      entry("Marsh Wren", "Wrens"),
      entry("Blue-gray Tanager", "Tanagers"),
      entry("Cactus Wren", "Wrens"),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.family === "Wrens")?.entries).toHaveLength(2);
  });

  it("test_group_by_family_orders_the_families_alphabetically", () => {
    const groups = groupByFamily([
      entry("Marsh Wren", "Wrens"),
      entry("Blue-gray Tanager", "Tanagers"),
      entry("Great Egret", "Herons"),
    ]);

    expect(groups.map((g) => g.family)).toEqual(["Herons", "Tanagers", "Wrens"]);
  });

  it("test_group_by_family_orders_the_birds_within_a_family_by_name", () => {
    const groups = groupByFamily([
      entry("Marsh Wren", "Wrens"),
      entry("Cactus Wren", "Wrens"),
    ]);

    expect(groups[0].entries.map((e) => e.name)).toEqual([
      "Cactus Wren",
      "Marsh Wren",
    ]);
  });

  it("test_group_by_family_files_a_bird_with_no_family_last", () => {
    // Not under U, which is where "Unplaced" would otherwise sort
    const groups = groupByFamily([
      entry("Nameless Bird", null),
      entry("Marsh Wren", "Wrens"),
      entry("Blue-gray Tanager", "Tanagers"),
    ]);

    expect(groups.map((g) => g.family)).toEqual([
      "Tanagers",
      "Wrens",
      UNPLACED,
    ]);
  });

  it("test_group_by_family_does_not_reorder_the_array_it_was_given", () => {
    const entries = [entry("Marsh Wren", "Wrens"), entry("Cactus Wren", "Wrens")];
    groupByFamily(entries);
    expect(entries.map((e) => e.name)).toEqual(["Marsh Wren", "Cactus Wren"]);
  });
});
