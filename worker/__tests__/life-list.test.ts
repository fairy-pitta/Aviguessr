import { describe, it, expect } from "vitest";
import {
  LIFE_LIST_UPSERT,
  pickReunionBird,
  recordedGuess,
  summarizeLifeList,
  type BogeyCandidate,
  type LifeListRow,
} from "../services/life-list";

function entry(overrides: Partial<LifeListRow> = {}): LifeListRow {
  return {
    bird_id: 1,
    name: "Marsh Wren",
    family: "Wrens",
    encounters: 1,
    correct: 1,
    best_score: 5200,
    last_guess: "US",
    first_seen_at: "2026-10-01 10:00:00",
    last_seen_at: "2026-10-01 10:00:00",
    ...overrides,
  };
}

describe("LIFE_LIST_UPSERT", () => {
  /** The statement is laid out in aligned columns; read it without them. */
  const sql = LIFE_LIST_UPSERT.replace(/\s+/g, " ");

  it("test_life_list_upsert_counts_one_more_encounter_on_conflict", () => {
    // A species joins the list when it is shown, so every guess is an encounter
    expect(sql).toContain("encounters = encounters + 1");
  });

  it("test_life_list_upsert_keeps_the_better_of_the_two_scores", () => {
    expect(sql).toContain("MAX(best_score, excluded.best_score)");
  });

  it("test_life_list_upsert_is_keyed_on_the_player_and_the_bird", () => {
    expect(sql).toContain("ON CONFLICT(player_id, bird_id)");
  });
});

describe("summarizeLifeList", () => {
  it("test_summarize_life_list_with_no_entries_returns_zeroes", () => {
    expect(summarizeLifeList([])).toEqual({ species: 0, named: 0, bogeys: 0 });
  });

  it("test_summarize_life_list_counts_a_named_species_as_named", () => {
    expect(summarizeLifeList([entry({ correct: 1 })])).toEqual({
      species: 1,
      named: 1,
      bogeys: 0,
    });
  });

  it("test_summarize_life_list_counts_a_never_named_species_as_a_bogey", () => {
    expect(summarizeLifeList([entry({ encounters: 3, correct: 0 })])).toEqual({
      species: 1,
      named: 0,
      bogeys: 1,
    });
  });

  it("test_summarize_life_list_counts_a_species_named_once_as_named", () => {
    // Getting it right once settles it; the bogey list is for the unsolved
    expect(summarizeLifeList([entry({ encounters: 4, correct: 1 })]).bogeys).toBe(0);
  });
});

describe("pickReunionBird", () => {
  const bogey = (bird_id: number, misses: number): BogeyCandidate => ({
    bird_id,
    misses,
  });

  it("test_pick_reunion_bird_with_no_candidates_returns_null", () => {
    expect(pickReunionBird([], 0.5)).toBeNull();
  });

  it("test_pick_reunion_bird_with_one_candidate_returns_it_for_any_roll", () => {
    expect(pickReunionBird([bogey(7, 1)], 0)).toBe(7);
    expect(pickReunionBird([bogey(7, 1)], 0.999)).toBe(7);
  });

  it("test_pick_reunion_bird_weights_a_bird_by_how_often_it_was_missed", () => {
    // Three misses to one: the nemesis holds three quarters of the interval
    const candidates = [bogey(1, 3), bogey(2, 1)];
    expect(pickReunionBird(candidates, 0.0)).toBe(1);
    expect(pickReunionBird(candidates, 0.74)).toBe(1);
    expect(pickReunionBird(candidates, 0.76)).toBe(2);
  });

  it("test_pick_reunion_bird_can_return_the_least_missed_bird", () => {
    // Weighted, not sorted: a deterministic pick would show the same bird
    // every game until it was finally named
    expect(pickReunionBird([bogey(1, 9), bogey(2, 1)], 0.95)).toBe(2);
  });

  it("test_pick_reunion_bird_with_a_roll_of_one_returns_the_last_candidate", () => {
    // Rounding must never fall off the end of the interval
    expect(pickReunionBird([bogey(1, 1), bogey(2, 1)], 1)).toBe(2);
  });

  it("test_pick_reunion_bird_with_zero_misses_recorded_still_returns_one", () => {
    // Weights of zero would make the interval empty; every candidate is a
    // bird the player has met and never named, so none is ineligible
    expect(pickReunionBird([bogey(1, 0), bogey(2, 0)], 0.6)).toBe(2);
  });
});

describe("recordedGuess", () => {
  it("test_recorded_guess_for_a_real_country_keeps_the_code", () => {
    expect(recordedGuess("BR")).toBe("BR");
  });

  it("test_recorded_guess_for_a_timed_out_round_records_nothing", () => {
    // A round that ran out of time submits a placeholder, not a country, and
    // "you said __TIMEOUT__ last time" is not a sentence
    expect(recordedGuess("__TIMEOUT__")).toBeNull();
  });

  it("test_recorded_guess_for_an_unknown_code_records_nothing", () => {
    expect(recordedGuess("ZZ")).toBeNull();
  });
});
