import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LifeList } from "@/widgets/life-list";
import type { LifeListEntry } from "@/entities/player";

function entry(
  name: string,
  family: string,
  overrides: Partial<LifeListEntry> = {}
): LifeListEntry {
  return {
    birdId: name.length + family.length,
    name,
    family,
    encounters: 1,
    correct: 1,
    bestScore: 4200,
    lastGuess: "US",
    firstSeenAt: "2026-10-01 10:00:00",
    lastSeenAt: "2026-10-01 10:00:00",
    imageUrl: "/api/birds/1/image",
    ...overrides,
  };
}

const summaryOf = (entries: LifeListEntry[]) => {
  const named = entries.filter((e) => e.correct > 0).length;
  return { species: entries.length, named, bogeys: entries.length - named };
};

function renderList(entries: LifeListEntry[]) {
  return render(<LifeList entries={entries} summary={summaryOf(entries)} />);
}

describe("LifeList", () => {
  it("test_render_with_no_entries_explains_how_birds_join_the_list", () => {
    render(
      <LifeList entries={[]} summary={{ species: 0, named: 0, bogeys: 0 }} />
    );
    expect(screen.getByText(/Nothing on the list yet/)).toBeInTheDocument();
  });

  it("test_render_groups_the_birds_under_their_family", () => {
    renderList([entry("Marsh Wren", "Wrens"), entry("Great Egret", "Herons")]);

    expect(screen.getByRole("heading", { name: "Wrens" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Herons" })).toBeInTheDocument();
  });

  it("test_render_a_placed_bird_shows_how_many_of_how_many", () => {
    renderList([entry("Marsh Wren", "Wrens", { encounters: 3, correct: 2 })]);
    expect(screen.getByText("Placed 2 of 3")).toBeInTheDocument();
  });

  it("test_render_a_bird_missed_once_says_so_in_the_singular", () => {
    renderList([entry("Marsh Wren", "Wrens", { encounters: 1, correct: 0 })]);
    expect(screen.getByText("Missed once")).toBeInTheDocument();
  });

  it("test_render_a_bird_missed_repeatedly_counts_the_misses", () => {
    renderList([entry("Marsh Wren", "Wrens", { encounters: 4, correct: 0 })]);
    expect(screen.getByText("Missed 4 times")).toBeInTheDocument();
  });

  it("test_filtering_to_unnamed_hides_the_birds_already_placed", () => {
    renderList([
      entry("Marsh Wren", "Wrens", { correct: 1 }),
      entry("Gray Antwren", "Antbirds", { encounters: 2, correct: 0 }),
    ]);

    fireEvent.click(screen.getByText(/Still unnamed/));

    expect(screen.queryByText("Marsh Wren")).not.toBeInTheDocument();
    expect(screen.getByText("Gray Antwren")).toBeInTheDocument();
  });

  it("test_filtering_to_unnamed_with_nothing_unnamed_says_so", () => {
    renderList([entry("Marsh Wren", "Wrens", { correct: 1 })]);

    fireEvent.click(screen.getByText(/Still unnamed/));

    expect(screen.getByText(/Nothing unnamed/)).toBeInTheDocument();
  });

  it("test_render_counts_the_unnamed_birds_on_the_filter", () => {
    renderList([
      entry("Marsh Wren", "Wrens", { correct: 1 }),
      entry("Gray Antwren", "Antbirds", { encounters: 2, correct: 0 }),
      entry("Collared Puffbird", "Puffbirds", { encounters: 1, correct: 0 }),
    ]);

    // The bogey count is what round four draws from, so it is worth a number
    expect(screen.getByText(/Still unnamed/).textContent).toContain("2");
  });
});
