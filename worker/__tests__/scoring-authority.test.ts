import { describe, it, expect } from "vitest";
import { elapsedMs, calculateTimeBonus } from "../services/game";

describe("elapsedMs", () => {
  const now = "2026-10-01T12:00:30Z"; // 30s after the start below
  const start = "2026-10-01T12:00:00Z";

  it("test_elapsed_ms_with_thirty_second_gap_returns_thirty_thousand", () => {
    expect(elapsedMs(start, now)).toBe(30000);
  });

  it("test_elapsed_ms_with_sqlite_datetime_format_parses_as_utc", () => {
    // SQLite datetime('now') has no timezone suffix and is UTC
    expect(elapsedMs("2026-10-01 12:00:00", "2026-10-01T12:00:05Z")).toBe(5000);
  });

  it("test_elapsed_ms_with_missing_start_returns_time_limit", () => {
    // No recorded start means no time bonus can be justified
    expect(elapsedMs(null, now)).toBe(30000);
  });

  it("test_elapsed_ms_beyond_the_limit_is_clamped_to_the_limit", () => {
    expect(elapsedMs(start, "2026-10-01T12:05:00Z")).toBe(30000);
  });

  it("test_elapsed_ms_with_clock_skew_backwards_returns_zero", () => {
    expect(elapsedMs(start, "2026-10-01T11:59:50Z")).toBe(0);
  });
});

describe("calculateTimeBonus", () => {
  it("test_calculate_time_bonus_at_zero_elapsed_returns_full_bonus", () => {
    expect(calculateTimeBonus(0)).toBe(1000);
  });

  it("test_calculate_time_bonus_at_the_limit_returns_zero", () => {
    expect(calculateTimeBonus(30000)).toBe(0);
  });

  it("test_calculate_time_bonus_past_the_limit_never_goes_negative", () => {
    expect(calculateTimeBonus(60000)).toBe(0);
  });

  it("test_calculate_time_bonus_at_half_the_limit_returns_half", () => {
    expect(calculateTimeBonus(15000)).toBe(500);
  });
});
