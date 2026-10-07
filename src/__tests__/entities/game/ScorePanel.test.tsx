import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScorePanel } from "@/entities/game";

describe("ScorePanel", () => {
  it("test_render_with_round_and_score_shows_formatted_values", () => {
    render(<ScorePanel currentRound={3} totalScore={12400} />);
    expect(screen.getByText("12,400")).toBeInTheDocument();
    // Round position reads as prose, so match across the elements
    expect(screen.getByText(/Plate/)).toHaveTextContent("Plate 3 of 5");
  });

  it("test_render_with_zero_score_shows_zero", () => {
    render(<ScorePanel currentRound={1} totalScore={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/Plate/)).toHaveTextContent("Plate 1 of 5");
  });

  it("test_render_without_a_streak_omits_the_streak_line", () => {
    render(<ScorePanel currentRound={1} totalScore={0} />);
    expect(screen.queryByText(/in a row/)).not.toBeInTheDocument();
  });

  it("test_render_with_a_streak_shows_how_many_in_a_row", () => {
    render(<ScorePanel currentRound={4} totalScore={900} currentStreak={3} />);
    expect(screen.getByText("3 in a row")).toBeInTheDocument();
  });
});
