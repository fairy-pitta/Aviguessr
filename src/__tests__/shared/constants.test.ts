import { describe, it, expect } from "vitest";
import { MAX_ROUNDS, TIME_LIMIT_MS, MAX_SCORE_PER_ROUND } from "@/shared/config/constants";

describe("game constants", () => {
  it("test_max_rounds_equals_five", () => {
    expect(MAX_ROUNDS).toBe(5);
  });

  it("test_time_limit_equals_thirty_seconds", () => {
    expect(TIME_LIMIT_MS).toBe(30000);
  });

  it("test_max_score_per_round_equals_five_thousand", () => {
    expect(MAX_SCORE_PER_ROUND).toBe(5000);
  });
});
