import { describe, it, expect } from "vitest";
import {
  randomBirdQuery,
  distinctFrom,
  FAME_BANDS,
  ROUND_FAME,
} from "../services/birds";

describe("randomBirdQuery", () => {
  it("test_random_bird_query_filters_out_unplayable_birds", () => {
    expect(randomBirdQuery(0)).toContain("playable = 1");
  });

  it("test_random_bird_query_draws_from_a_band_of_observations", () => {
    // Range breadth said nothing about whether a player would know the bird,
    // which is how a round opened with a Gray Antwren
    const sql = randomBirdQuery(0);
    expect(sql).toContain("observations >= ?");
    expect(sql).toContain("observations < ?");
    expect(sql).not.toContain("difficulty = ?");
  });

  it("test_random_bird_query_with_no_exclusions_has_no_id_filter", () => {
    expect(randomBirdQuery(0)).not.toContain("id NOT IN");
  });

  it("test_random_bird_query_with_exclusions_adds_one_placeholder_each", () => {
    expect(randomBirdQuery(3)).toContain("id NOT IN (?, ?, ?)");
  });

  it("test_random_bird_query_orders_randomly_and_takes_one", () => {
    const sql = randomBirdQuery(1);
    expect(sql).toContain("ORDER BY RANDOM()");
    expect(sql).toContain("LIMIT 1");
  });
});

describe("FAME_BANDS", () => {
  it("test_fame_bands_cover_every_count_without_overlapping", () => {
    const { familiar, known, obscure } = FAME_BANDS;
    expect(obscure.min).toBe(0);
    expect(obscure.max).toBe(known.min);
    expect(known.max).toBe(familiar.min);
    // Nothing is too well observed to be drawn
    expect(familiar.max).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("ROUND_FAME", () => {
  it("test_round_fame_opens_on_birds_people_know_and_ends_obscure", () => {
    expect(ROUND_FAME).toEqual([
      "familiar",
      "familiar",
      "known",
      "known",
      "obscure",
    ]);
  });
});

describe("distinctFrom", () => {
  it("test_distinct_from_with_no_picks_returns_empty_list", () => {
    expect(distinctFrom([])).toEqual([]);
  });

  it("test_distinct_from_returns_ids_of_already_picked_birds", () => {
    expect(distinctFrom([{ id: 7 }, { id: 12 }])).toEqual([7, 12]);
  });
});
