import { describe, it, expect } from "vitest";

// Re-implement the pure logic functions for testing since they're not exported
// (testing the actual algorithms used in worker/services/game.ts)

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateScore(distanceKm: number): number {
  return Math.round(5000 * Math.exp(-distanceKm / 2000));
}

function calculateTimeBonus(timeMs: number): number {
  return Math.max(0, Math.round(1000 * (1 - timeMs / 30000)));
}

describe("score calculation", () => {
  it("test_calculate_score_at_zero_distance_returns_max", () => {
    expect(calculateScore(0)).toBe(5000);
  });

  it("test_calculate_score_at_2000km_returns_approx_1839", () => {
    // 5000 * e^(-1) ≈ 1839
    const score = calculateScore(2000);
    expect(score).toBeGreaterThan(1830);
    expect(score).toBeLessThan(1850);
  });

  it("test_calculate_score_at_large_distance_returns_near_zero", () => {
    expect(calculateScore(20000)).toBeLessThan(25);
  });

  it("test_calculate_score_decreases_with_distance", () => {
    const s1 = calculateScore(500);
    const s2 = calculateScore(1000);
    const s3 = calculateScore(5000);
    expect(s1).toBeGreaterThan(s2);
    expect(s2).toBeGreaterThan(s3);
  });
});

describe("time bonus", () => {
  it("test_calculate_time_bonus_at_zero_returns_max", () => {
    expect(calculateTimeBonus(0)).toBe(1000);
  });

  it("test_calculate_time_bonus_at_half_time_returns_500", () => {
    expect(calculateTimeBonus(15000)).toBe(500);
  });

  it("test_calculate_time_bonus_at_timeout_returns_zero", () => {
    expect(calculateTimeBonus(30000)).toBe(0);
  });

  it("test_calculate_time_bonus_over_limit_returns_zero", () => {
    expect(calculateTimeBonus(35000)).toBe(0);
  });
});

describe("haversine distance (worker)", () => {
  it("test_distance_tokyo_to_london_returns_approx_9560km", () => {
    const d = haversineDistance(35.6762, 139.6503, 51.5074, -0.1278);
    expect(d).toBeGreaterThan(9500);
    expect(d).toBeLessThan(9600);
  });

  it("test_distance_same_point_returns_zero", () => {
    expect(haversineDistance(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("test_distance_antipodal_points_returns_approx_half_circumference", () => {
    // North pole to south pole ≈ 20015 km
    const d = haversineDistance(90, 0, -90, 0);
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20100);
  });
});
