import { describe, it, expect } from "vitest";
import { advanceStreak, daysBetween } from "../services/streak";

const state = (
  streak: number,
  lastDate: string | null,
  absenceMonth: string | null = null
) => ({ streak, lastDate, absenceMonth });

describe("daysBetween", () => {
  it("test_days_between_consecutive_dates_is_one", () => {
    expect(daysBetween("2026-10-16", "2026-10-17")).toBe(1);
  });

  it("test_days_between_dates_across_a_month_boundary_counts_the_days", () => {
    expect(daysBetween("2026-10-31", "2026-11-01")).toBe(1);
  });

  it("test_days_between_dates_across_a_leap_day_counts_the_days", () => {
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("test_days_between_the_same_date_is_zero", () => {
    expect(daysBetween("2026-10-17", "2026-10-17")).toBe(0);
  });
});

describe("advanceStreak", () => {
  it("test_advance_streak_on_a_first_ever_daily_starts_at_one", () => {
    expect(advanceStreak(state(0, null), "2026-10-17")).toEqual({
      streak: 1,
      lastDate: "2026-10-17",
      absenceMonth: null,
    });
  });

  it("test_advance_streak_the_day_after_the_last_one_counts_up", () => {
    expect(advanceStreak(state(7, "2026-10-16"), "2026-10-17").streak).toBe(8);
  });

  it("test_advance_streak_twice_on_the_same_day_changes_nothing", () => {
    // Submitting a finished daily again must not inflate the streak
    const already = state(7, "2026-10-17", "2026-10");
    expect(advanceStreak(already, "2026-10-17")).toEqual({
      streak: 7,
      lastDate: "2026-10-17",
      absenceMonth: "2026-10",
    });
  });

  it("test_advance_streak_after_one_missed_day_spends_the_monthly_absence", () => {
    expect(advanceStreak(state(7, "2026-10-15"), "2026-10-17")).toEqual({
      streak: 8,
      lastDate: "2026-10-17",
      absenceMonth: "2026-10",
    });
  });

  it("test_advance_streak_after_a_second_missed_day_in_a_month_restarts", () => {
    // One forgiven day a month, not one a week
    expect(
      advanceStreak(state(9, "2026-10-20", "2026-10"), "2026-10-22").streak
    ).toBe(1);
  });

  it("test_advance_streak_after_a_missed_day_in_a_new_month_is_forgiven_again", () => {
    // The absence is spent per calendar month, so November brings a fresh one
    expect(
      advanceStreak(state(9, "2026-10-31", "2026-10"), "2026-11-02")
    ).toEqual({ streak: 10, lastDate: "2026-11-02", absenceMonth: "2026-11" });
  });

  it("test_advance_streak_charges_the_absence_to_the_month_of_the_missed_day", () => {
    // Played Oct 30, missed Oct 31, played Nov 1: that is October's absence,
    // and spending November's on it would take a day never used
    expect(
      advanceStreak(state(9, "2026-10-30", null), "2026-11-01").absenceMonth
    ).toBe("2026-10");
  });

  it("test_advance_streak_still_forgives_a_day_in_november_after_one_in_october", () => {
    const afterHalloween = advanceStreak(state(9, "2026-10-30", null), "2026-11-01");
    // Played Nov 1, missed Nov 2, played Nov 3 — November's own absence
    expect(advanceStreak(afterHalloween, "2026-11-03")).toEqual({
      streak: 11,
      lastDate: "2026-11-03",
      absenceMonth: "2026-11",
    });
  });

  it("test_advance_streak_refuses_a_second_absence_in_the_month_it_was_spent", () => {
    // The October absence was spent on Oct 31; missing Nov 5 is not October's
    const spent = state(9, "2026-11-04", "2026-11");
    expect(advanceStreak(spent, "2026-11-06").streak).toBe(1);
  });

  it("test_advance_streak_after_two_missed_days_restarts_even_when_unspent", () => {
    // The absence forgives one day, and this is two
    expect(advanceStreak(state(40, "2026-10-13"), "2026-10-17")).toEqual({
      streak: 1,
      lastDate: "2026-10-17",
      absenceMonth: null,
    });
  });

  it("test_advance_streak_with_a_last_date_in_the_future_restarts", () => {
    // Nothing legitimate produces this; it must not count as a gap of -1
    expect(advanceStreak(state(5, "2026-10-20"), "2026-10-17").streak).toBe(1);
  });

  it("test_advance_streak_keeps_an_unspent_absence_when_no_day_was_missed", () => {
    expect(
      advanceStreak(state(3, "2026-10-16", null), "2026-10-17").absenceMonth
    ).toBeNull();
  });
});
