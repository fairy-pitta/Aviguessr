import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BirdAccount } from "@/widgets/result-page";
import type { Bird } from "@/entities/bird";
import type { GuessResponse } from "@/entities/game";

const bird: Bird = {
  id: 1,
  name: "Marsh Wren",
  // The question withholds it; the result carries it
  family: null,
  difficulty: "easy",
  imageUrl: "/api/birds/1/image",
};

function result(overrides: Partial<GuessResponse> = {}): GuessResponse {
  return {
    isCorrect: true,
    correctCountries: ["US"],
    distanceKm: 0,
    score: 5000,
    timeBonus: 400,
    streakLength: 0,
    streakBonus: 0,
    totalScore: 5400,
    gameFinished: false,
    speciesName: "Marsh Wren",
    family: "Wrens",
    encounter: null,
    ...overrides,
  };
}

describe("BirdAccount", () => {
  it("test_render_shows_the_family_the_question_had_withheld", () => {
    // The family is what the level-two hint sells, so it arrives here
    render(<BirdAccount bird={bird} result={result()} />);
    expect(screen.getByText("Wrens")).toBeInTheDocument();
  });

  it("test_render_a_first_encounter_says_nothing_about_meeting_before", () => {
    render(<BirdAccount bird={bird} result={result()} />);
    expect(screen.queryByText(/before/)).not.toBeInTheDocument();
  });

  it("test_render_a_bogey_finally_named_says_it_was_named_at_last", () => {
    render(
      <BirdAccount
        bird={bird}
        result={result({
          isCorrect: true,
          encounter: { count: 2, previousGuess: "BR", everNamed: false },
        })}
      />
    );

    expect(screen.getByText(/Missed 2 times before/)).toBeInTheDocument();
    expect(screen.getByText(/Brazil/)).toBeInTheDocument();
    expect(screen.getByText(/Named at last/)).toBeInTheDocument();
  });

  it("test_render_a_bogey_missed_again_still_calls_it_a_bogey_bird", () => {
    render(
      <BirdAccount
        bird={bird}
        result={result({
          isCorrect: false,
          encounter: { count: 1, previousGuess: "BR", everNamed: false },
        })}
      />
    );

    expect(screen.getByText(/Missed once before/)).toBeInTheDocument();
    expect(screen.getByText(/Still your bogey bird/)).toBeInTheDocument();
  });

  it("test_render_a_bird_already_named_once_reports_the_earlier_meeting", () => {
    render(
      <BirdAccount
        bird={bird}
        result={result({
          encounter: { count: 3, previousGuess: "US", everNamed: true },
        })}
      />
    );

    expect(
      screen.getByText(/You have met this bird before, and said United States/)
    ).toBeInTheDocument();
  });

  it("test_render_an_encounter_with_no_recorded_guess_omits_the_country", () => {
    render(
      <BirdAccount
        bird={bird}
        result={result({
          isCorrect: false,
          encounter: { count: 1, previousGuess: null, everNamed: false },
        })}
      />
    );

    expect(screen.getByText(/Missed once before\./)).toBeInTheDocument();
  });
});
