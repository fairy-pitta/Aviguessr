import { describe, it, expect } from "vitest";
import { haversineDistance } from "@/shared/lib/haversine";

describe("haversineDistance", () => {
  it("test_distance_between_same_point_returns_zero", () => {
    expect(haversineDistance(0, 0, 0, 0)).toBe(0);
  });

  it("test_distance_between_known_cities_returns_approximate_value", () => {
    // Tokyo (35.6762, 139.6503) to New York (40.7128, -74.0060) ≈ 10,838 km
    const d = haversineDistance(35.6762, 139.6503, 40.7128, -74.006);
    expect(d).toBeGreaterThan(10700);
    expect(d).toBeLessThan(11000);
  });

  it("test_distance_between_nearby_points_returns_small_value", () => {
    // ~111 km per degree at equator
    const d = haversineDistance(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("test_distance_is_symmetric", () => {
    const d1 = haversineDistance(35, 139, 40, -74);
    const d2 = haversineDistance(40, -74, 35, 139);
    expect(d1).toBeCloseTo(d2, 5);
  });
});
