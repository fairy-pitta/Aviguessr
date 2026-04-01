import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameSummary } from "@/widgets/game-summary";
import type { GameRound } from "@/entities/game";

const mockRounds: GameRound[] = [
  {
    round: 1,
    bird: { id: 1, name: "Sparrow", family: "Passeridae", difficulty: "easy", imageUrl: "/img/1" },
    result: { guessedCountry: "JP", isCorrect: true, distanceKm: 0, score: 5800, timeMs: 5000 },
  },
  {
    round: 2,
    bird: { id: 2, name: "Eagle", family: "Accipitridae", difficulty: "easy", imageUrl: "/img/2" },
    result: { guessedCountry: "BR", isCorrect: false, distanceKm: 3000, score: 1200, timeMs: 20000 },
  },
  {
    round: 3,
    bird: { id: 3, name: "Penguin", family: "Spheniscidae", difficulty: "medium", imageUrl: "/img/3" },
    result: { guessedCountry: "AQ", isCorrect: true, distanceKm: 0, score: 5500, timeMs: 8000 },
  },
  {
    round: 4,
    bird: { id: 4, name: "Flamingo", family: "Phoenicopteridae", difficulty: "medium", imageUrl: "/img/4" },
    result: { guessedCountry: "KE", isCorrect: false, distanceKm: 1000, score: 3000, timeMs: 15000 },
  },
  {
    round: 5,
    bird: { id: 5, name: "Toucan", family: "Ramphastidae", difficulty: "hard", imageUrl: "/img/5" },
    result: { guessedCountry: "CO", isCorrect: true, distanceKm: 0, score: 5900, timeMs: 3000 },
  },
];

describe("GameSummary", () => {
  it("test_render_with_results_shows_total_score", () => {
    render(
      <GameSummary
        rounds={mockRounds}
        totalScore={21400}
        onPlayAgain={vi.fn()}
      />
    );
    expect(screen.getByText("21,400")).toBeInTheDocument();
    expect(screen.getByText("Game Complete")).toBeInTheDocument();
  });

  it("test_render_shows_all_bird_names", () => {
    render(
      <GameSummary
        rounds={mockRounds}
        totalScore={21400}
        onPlayAgain={vi.fn()}
      />
    );
    expect(screen.getByText("Sparrow")).toBeInTheDocument();
    expect(screen.getByText("Eagle")).toBeInTheDocument();
    expect(screen.getByText("Toucan")).toBeInTheDocument();
  });

  it("test_click_play_again_calls_handler", () => {
    const onPlayAgain = vi.fn();
    render(
      <GameSummary
        rounds={mockRounds}
        totalScore={21400}
        onPlayAgain={onPlayAgain}
      />
    );
    fireEvent.click(screen.getByText("Play Again"));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
