import { describe, it, expect } from "vitest";
import { describeRange } from "../services/range";

describe("describeRange", () => {
  it("test_describe_range_of_one_country_calls_the_bird_endemic", () => {
    expect(describeRange(["PE"])).toBe("Endemic to Peru");
  });

  it("test_describe_range_of_three_countries_names_them_all", () => {
    expect(describeRange(["PE", "BO", "EC"])).toBe("Found in Peru, Bolivia, Ecuador");
  });

  it("test_describe_range_within_one_subregion_names_the_subregion", () => {
    // Four or more countries is too many to list, so the shape of the range
    // is described instead
    const range = describeRange(["CR", "NI", "HN", "GT", "PA"]);
    expect(range).toBe("Found across Central America (5 countries)");
  });

  it("test_describe_range_across_one_continent_names_the_continent", () => {
    // Four subregions of Africa: too spread out to call it one of them
    const range = describeRange(["EG", "KE", "NG", "ZA", "TZ", "GH"]);
    expect(range).toBe("Distributed across Africa (6 countries)");
  });

  it("test_describe_range_across_two_continents_joins_them_with_and", () => {
    const range = describeRange(["GB", "FR", "DE", "MA", "DZ", "TN"]);
    expect(range).toBe("Wide range across Europe and Africa (6 countries)");
  });

  it("test_describe_range_across_three_continents_reads_as_a_list", () => {
    const range = describeRange(["GB", "FR", "MA", "DZ", "IN", "CN", "JP"]);
    expect(range).toBe("Wide range across Europe, Africa and Asia (7 countries)");
  });

  it("test_describe_range_ignores_codes_that_are_not_a_country", () => {
    // XX marks a record that could not be placed in a country
    expect(describeRange(["PE", "XX"])).toBe("Endemic to Peru");
  });

  it("test_describe_range_of_nothing_placeable_returns_null", () => {
    expect(describeRange([])).toBeNull();
    expect(describeRange(["XX"])).toBeNull();
  });
});
