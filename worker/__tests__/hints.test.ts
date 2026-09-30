import { describe, it, expect } from "vitest";
import { formatHint } from "../services/hints";

describe("formatHint", () => {
  it("test_format_hint_level_1_with_single_continent_returns_continent_name", () => {
    expect(formatHint(["JP", "KR"], 1)).toBe("This bird lives in: Asia");
  });

  it("test_format_hint_level_1_with_multiple_continents_joins_all", () => {
    expect(formatHint(["JP", "DE"], 1)).toBe("This bird lives in: Asia, Europe");
  });

  it("test_format_hint_level_2_with_known_codes_returns_subregions", () => {
    expect(formatHint(["JP"], 2)).toBe("Found in: Eastern Asia");
  });

  it("test_format_hint_level_3_no_longer_names_a_country", () => {
    // Naming a correct country was the answer to the game itself
    expect(formatHint(["JP"], 3)).toBe("Invalid hint level");
  });

  it("test_format_hint_level_2_with_supplemented_territory_returns_subregion", () => {
    expect(formatHint(["HK"], 2)).toBe("Found in: Eastern Asia");
  });

  it("test_format_hint_with_empty_countries_returns_no_data_message", () => {
    expect(formatHint([], 1)).toBe("No habitat data available");
  });

  it("test_format_hint_with_unknown_level_returns_invalid_message", () => {
    expect(formatHint(["JP"], 9)).toBe("Invalid hint level");
  });
});
