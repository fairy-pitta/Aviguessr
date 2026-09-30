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

  it("test_format_hint_level_3_with_single_country_returns_display_name", () => {
    expect(formatHint(["JP"], 3)).toBe("One correct country: Japan");
  });

  it("test_format_hint_level_3_with_unmapped_code_falls_back_to_code", () => {
    expect(formatHint(["ZZ"], 3)).toBe("One correct country: ZZ");
  });

  it("test_format_hint_level_3_always_picks_from_given_countries", () => {
    const codes = ["JP", "DE", "BR"];
    const names = new Set(["Japan", "Germany", "Brazil"]);
    for (let i = 0; i < 50; i++) {
      const hint = formatHint(codes, 3).replace("One correct country: ", "");
      expect(names.has(hint)).toBe(true);
    }
  });

  it("test_format_hint_level_3_with_supplemented_territory_returns_display_name", () => {
    // Singapore is absent from the low-resolution world map; generate-centroids
    // supplements it so hints never leak a raw ISO code.
    expect(formatHint(["SG"], 3)).toBe("One correct country: Singapore");
  });

  it("test_format_hint_level_3_with_remapped_taiwan_returns_display_name", () => {
    // Natural Earth spells Taiwan "CN-TW"; the generator remaps it to TW.
    expect(formatHint(["TW"], 3)).toBe("One correct country: Taiwan");
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
