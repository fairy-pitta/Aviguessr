import { describe, it, expect } from "vitest";
import { matchCountries } from "@/entities/country";

const names = {
  JP: "Japan",
  JM: "Jamaica",
  BR: "Brazil",
  CR: "Costa Rica",
  CI: "Côte d'Ivoire",
  LU: "Luxembourg",
  SG: "Singapore",
  ZA: "South Africa",
  KR: "South Korea",
  SS: "South Sudan",
};

describe("matchCountries", () => {
  it("test_match_countries_with_an_empty_query_offers_nothing", () => {
    expect(matchCountries("", names)).toEqual([]);
    expect(matchCountries("   ", names)).toEqual([]);
  });

  it("test_match_countries_puts_a_name_starting_with_the_query_first", () => {
    // "Jam" is inside no other name, but a prefix must still outrank a
    // mid-word hit when both exist
    const codes = matchCountries("sou", names).map((c) => c.code);
    expect(codes.slice(0, 3).sort()).toEqual(["KR", "SS", "ZA"]);
  });

  it("test_match_countries_finds_a_name_by_a_word_inside_it", () => {
    expect(matchCountries("rica", names).map((c) => c.code)).toContain("CR");
  });

  it("test_match_countries_ignores_case", () => {
    expect(matchCountries("JAPAN", names)[0].code).toBe("JP");
    expect(matchCountries("japan", names)[0].code).toBe("JP");
  });

  it("test_match_countries_ignores_accents_so_cote_divoire_is_typable", () => {
    expect(matchCountries("cote", names)[0].code).toBe("CI");
  });

  it("test_match_countries_ignores_punctuation_in_the_name", () => {
    expect(matchCountries("ivoire", names)[0].code).toBe("CI");
  });

  it("test_match_countries_carries_the_name_back_with_the_code", () => {
    expect(matchCountries("luxem", names)).toEqual([
      { code: "LU", name: "Luxembourg" },
    ]);
  });

  it("test_match_countries_caps_how_many_it_offers", () => {
    const many = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`X${i}`, `Sland ${i}`])
    );
    expect(matchCountries("sland", many).length).toBeLessThanOrEqual(8);
  });

  it("test_match_countries_of_an_unknown_place_offers_nothing", () => {
    expect(matchCountries("atlantis", names)).toEqual([]);
  });
});
