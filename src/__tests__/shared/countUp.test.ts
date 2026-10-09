import { describe, it, expect } from "vitest";
import { easeOutCubic, countAt } from "@/shared/lib/countUp";

describe("easeOutCubic", () => {
  it("test_ease_out_cubic_at_the_start_is_zero", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("test_ease_out_cubic_at_the_end_is_one", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("test_ease_out_cubic_spends_most_of_its_travel_early", () => {
    // A tally that sprints and settles, rather than crawling at a fixed rate
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.8);
  });

  it("test_ease_out_cubic_clamps_progress_past_the_end", () => {
    expect(easeOutCubic(1.4)).toBe(1);
    expect(easeOutCubic(-0.2)).toBe(0);
  });
});

describe("countAt", () => {
  it("test_count_at_the_start_shows_nothing_counted_yet", () => {
    expect(countAt(5000, 0)).toBe(0);
  });

  it("test_count_at_the_end_shows_the_whole_total", () => {
    expect(countAt(5000, 1)).toBe(5000);
  });

  it("test_count_is_always_a_whole_number", () => {
    expect(Number.isInteger(countAt(4321, 0.37))).toBe(true);
  });

  it("test_count_of_zero_stays_zero_throughout", () => {
    // A missed round scores nothing, and nothing should tick
    expect(countAt(0, 0.5)).toBe(0);
  });
});
