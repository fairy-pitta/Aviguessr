import { describe, it, expect } from "vitest";
import { serializeDailyRounds, type DailyRoundRow } from "../services/daily";

function row(overrides: Partial<DailyRoundRow> = {}): DailyRoundRow {
  return {
    round: 1,
    bird_id: 42,
    name: "Marsh Wren",
    family: "Wrens",
    difficulty: "easy",
    habitat: "Wetland & Freshwater",
    biome: "wetland",
    guessed_country: "US",
    is_correct: 1,
    distance_km: 0,
    score: 5800,
    time_ms: 4200,
    ...overrides,
  };
}

describe("serializeDailyRounds", () => {
  it("test_serialize_daily_rounds_maps_a_round_to_the_client_shape", () => {
    const [r] = serializeDailyRounds([row()]);
    expect(r.round).toBe(1);
    expect(r.bird.name).toBe("Marsh Wren");
    expect(r.bird.imageUrl).toBe("/api/birds/42/image");
    expect(r.result).toEqual({
      guessedCountry: "US",
      isCorrect: true,
      distanceKm: 0,
      score: 5800,
      timeMs: 4200,
    });
  });

  it("test_serialize_daily_rounds_marks_an_incorrect_guess_as_not_correct", () => {
    const [r] = serializeDailyRounds([row({ is_correct: 0, score: 120 })]);
    expect(r.result?.isCorrect).toBe(false);
    expect(r.result?.score).toBe(120);
  });

  it("test_serialize_daily_rounds_with_an_unanswered_round_returns_null_result", () => {
    const [r] = serializeDailyRounds([
      row({ guessed_country: null, is_correct: null, score: null, time_ms: null }),
    ]);
    expect(r.result).toBeNull();
  });

  it("test_serialize_daily_rounds_keeps_rounds_in_order", () => {
    const rounds = serializeDailyRounds([
      row({ round: 2 }),
      row({ round: 1 }),
      row({ round: 3 }),
    ]);
    expect(rounds.map((r) => r.round)).toEqual([1, 2, 3]);
  });

  it("test_serialize_daily_rounds_with_no_rows_returns_empty_list", () => {
    expect(serializeDailyRounds([])).toEqual([]);
  });

  it("test_serialize_daily_rounds_passes_null_family_through", () => {
    const [r] = serializeDailyRounds([row({ family: null })]);
    expect(r.bird.family).toBeNull();
  });
});
