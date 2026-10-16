import { describe, it, expect } from "vitest";
import {
  rangeWeight,
  roundMaximum,
  gameMaximum,
} from "../services/range-weight";

describe("rangeWeight", () => {
  it("test_range_weight_of_the_median_range_is_about_one", () => {
    // Four countries is the median across the playable pool, so a typical
    // round is worth what it always was
    expect(rangeWeight(4)).toBeCloseTo(1.0, 2);
  });

  it("test_range_weight_of_an_endemic_is_the_highest_it_goes", () => {
    // One country means exactly one right answer out of 185
    expect(rangeWeight(1)).toBeCloseTo(1.225, 3);
  });

  it("test_range_weight_falls_as_the_range_widens", () => {
    const widening = [1, 2, 4, 10, 30, 100].map(rangeWeight);
    for (let i = 1; i < widening.length; i++) {
      expect(widening[i]).toBeLessThan(widening[i - 1]);
    }
  });

  it("test_range_weight_of_a_cosmopolitan_bird_approaches_the_floor", () => {
    // Recorded in 150 countries, a correct answer says almost nothing
    expect(rangeWeight(150)).toBeGreaterThan(0.7);
    expect(rangeWeight(150)).toBeLessThan(0.73);
  });

  it("test_range_weight_never_reaches_the_floor_so_there_is_no_cliff", () => {
    expect(rangeWeight(100000)).toBeGreaterThan(0.7);
  });

  it("test_range_weight_of_a_species_with_no_countries_is_treated_as_endemic", () => {
    // Should not happen — a bird nowhere is never served — but a zero must
    // not divide the round's worth away
    expect(rangeWeight(0)).toBe(rangeWeight(1));
    expect(rangeWeight(-3)).toBe(rangeWeight(1));
  });
});

describe("roundMaximum", () => {
  it("test_round_maximum_of_the_median_range_is_the_old_five_thousand", () => {
    expect(roundMaximum(4)).toBe(5000);
  });

  it("test_round_maximum_of_an_endemic_is_worth_more", () => {
    expect(roundMaximum(1)).toBe(6125);
  });

  it("test_round_maximum_of_a_cosmopolitan_bird_is_worth_less", () => {
    expect(roundMaximum(150)).toBe(3569);
  });

  it("test_round_maximum_is_a_whole_number", () => {
    for (const n of [1, 3, 7, 19, 55, 183]) {
      expect(Number.isInteger(roundMaximum(n))).toBe(true);
    }
  });
});

describe("gameMaximum", () => {
  it("test_game_maximum_of_five_median_birds_is_the_old_perfect_score", () => {
    // 5,000 a round plus the full speed bonus, with the streak multiplier
    // climbing 1.0 through 1.4
    expect(gameMaximum([4, 4, 4, 4, 4])).toBe(36000);
  });

  it("test_game_maximum_rises_when_the_birds_are_narrow_ranging", () => {
    expect(gameMaximum([1, 1, 1, 1, 1])).toBeGreaterThan(36000);
  });

  it("test_game_maximum_falls_when_the_birds_are_everywhere", () => {
    expect(gameMaximum([150, 150, 150, 150, 150])).toBeLessThan(36000);
  });

  it("test_game_maximum_weights_the_later_rounds_by_the_streak", () => {
    // The same bird is worth more as round five than as round one
    const early = gameMaximum([1, 150, 150, 150, 150]);
    const late = gameMaximum([150, 150, 150, 150, 1]);
    expect(late).toBeGreaterThan(early);
  });

  it("test_game_maximum_of_no_rounds_is_nothing", () => {
    expect(gameMaximum([])).toBe(0);
  });
});
