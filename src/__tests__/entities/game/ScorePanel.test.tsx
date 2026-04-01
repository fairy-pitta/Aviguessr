import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScorePanel } from "@/entities/game";

describe("ScorePanel", () => {
  it("test_render_with_round_and_score_shows_formatted_values", () => {
    render(<ScorePanel currentRound={3} totalScore={12400} />);
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getByText("12,400")).toBeInTheDocument();
  });

  it("test_render_with_zero_score_shows_zero", () => {
    render(<ScorePanel currentRound={1} totalScore={0} />);
    expect(screen.getByText("1/5")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
