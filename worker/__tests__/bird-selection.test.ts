import { describe, it, expect } from "vitest";
import { randomBirdQuery, distinctFrom } from "../services/birds";

describe("randomBirdQuery", () => {
  it("test_random_bird_query_filters_out_unplayable_birds", () => {
    expect(randomBirdQuery(0)).toContain("playable = 1");
  });

  it("test_random_bird_query_filters_by_difficulty", () => {
    expect(randomBirdQuery(0)).toContain("difficulty = ?");
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

describe("distinctFrom", () => {
  it("test_distinct_from_with_no_picks_returns_empty_list", () => {
    expect(distinctFrom([])).toEqual([]);
  });

  it("test_distinct_from_returns_ids_of_already_picked_birds", () => {
    expect(distinctFrom([{ id: 7 }, { id: 12 }])).toEqual([7, 12]);
  });
});
