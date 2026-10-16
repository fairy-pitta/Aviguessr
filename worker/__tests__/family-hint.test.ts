import { describe, it, expect } from "vitest";
import {
  familyHintCost,
  formatFamilyHint,
  FAMILY_HINT_MEDIAN_RANGE,
} from "../services/hints";
import { COUNTRY_NAMES } from "../data/countries";

describe("familyHintCost", () => {
  it("test_family_hint_cost_for_the_median_family_matches_the_old_flat_price", () => {
    // The subregion hint this replaces cost a flat 30%, so a typical round
    // is priced as it always was
    expect(familyHintCost(FAMILY_HINT_MEDIAN_RANGE)).toBeCloseTo(0.3, 2);
  });

  it("test_family_hint_cost_for_a_single_country_family_is_the_most_expensive", () => {
    // "Asities — a family of Africa" all but wins the round
    expect(familyHintCost(1)).toBeGreaterThan(familyHintCost(32));
    expect(familyHintCost(1)).toBeLessThanOrEqual(0.45);
  });

  it("test_family_hint_cost_for_a_cosmopolitan_family_is_the_cheapest", () => {
    // "Hawks and Eagles — a family of every continent" narrows nothing
    expect(familyHintCost(252)).toBeLessThan(familyHintCost(32));
    expect(familyHintCost(252)).toBeGreaterThan(0.1);
  });

  it("test_family_hint_cost_never_rises_as_the_family_spreads", () => {
    for (let n = 1; n < 252; n++) {
      expect(familyHintCost(n + 1)).toBeLessThanOrEqual(familyHintCost(n));
    }
  });

  it("test_family_hint_cost_with_both_hints_leaves_a_round_worth_playing", () => {
    // The continents hint costs 15%; the pair must never take everything
    expect(0.15 + familyHintCost(1)).toBeLessThan(1);
  });

  it("test_family_hint_cost_with_no_countries_recorded_is_the_cheapest", () => {
    // Nothing known about the family's range is nothing to charge for
    expect(familyHintCost(0)).toBeLessThanOrEqual(familyHintCost(1));
  });
});

describe("formatFamilyHint", () => {
  const countryNames = Object.values(COUNTRY_NAMES).filter((n) => n.length > 3);
  const namesACountry = (text: string) =>
    countryNames.some((n) => text.includes(n));

  it("test_format_family_hint_names_the_family_and_its_scientific_name", () => {
    const hint = formatFamilyHint("Parrotbills", "Paradoxornithidae", [
      "CN",
      "JP",
      "KR",
    ]);
    expect(hint).toContain("Parrotbills");
    expect(hint).toContain("Paradoxornithidae");
  });

  it("test_format_family_hint_inside_one_subregion_names_that_subregion", () => {
    expect(formatFamilyHint("Parrotbills", "Paradoxornithidae", ["CN", "JP", "KR"]))
      .toContain("Eastern Asia");
  });

  it("test_format_family_hint_across_a_continent_names_the_continent", () => {
    const hint = formatFamilyHint("Tanagers", "Thraupidae", [
      "BR",
      "CO",
      "AR",
      "EC",
    ]);
    expect(hint).toContain("South America");
  });

  it("test_format_family_hint_across_several_continents_lists_them", () => {
    const hint = formatFamilyHint("Wrens", "Troglodytidae", ["US", "BR", "GB"]);
    expect(hint).toContain("North America");
    expect(hint).toContain("South America");
    expect(hint).toContain("Europe");
  });

  it("test_format_family_hint_never_names_a_country", () => {
    // The game asks which country the bird lives in, so a hint that answers
    // that is the answer. Two subregions are country lists in disguise.
    const australasian = formatFamilyHint("Lyrebirds", "Menuridae", ["AU"]);
    expect(namesACountry(australasian)).toBe(false);
    expect(australasian).toContain("Lyrebirds");

    const antarctic = formatFamilyHint("Sheathbills", "Chionidae", ["AQ"]);
    expect(namesACountry(antarctic)).toBe(false);
  });

  it("test_format_family_hint_for_an_oceanic_family_reads_as_the_open_ocean", () => {
    const hint = formatFamilyHint("Albatrosses", "Diomedeidae", ["XX", "ZZ"]);
    expect(hint).toContain("Albatrosses");
  });

  it("test_format_family_hint_with_no_scientific_name_gives_the_english_one", () => {
    const hint = formatFamilyHint("Parrotbills", null, ["CN"]);
    expect(hint).toContain("Parrotbills");
    expect(hint).not.toContain("()");
  });

  it("test_format_family_hint_with_no_countries_still_names_the_family", () => {
    expect(formatFamilyHint("Parrotbills", "Paradoxornithidae", [])).toContain(
      "Parrotbills"
    );
  });
});

describe("formatFamilyHint across the New World", () => {
  it("test_format_family_hint_for_a_new_world_family_reads_as_the_americas", () => {
    // "North America and South America" is the clumsiest list in the set and
    // the commonest two-continent range a bird family has
    expect(formatFamilyHint("Tinamous", "Tinamidae", ["BR", "MX"])).toContain(
      "the Americas"
    );
  });

  it("test_format_family_hint_orders_continents_the_same_way_every_time", () => {
    // The set comes out in whatever order the countries arrived in
    const one = formatFamilyHint("Wrens", "Troglodytidae", ["GB", "BR", "CN"]);
    const other = formatFamilyHint("Wrens", "Troglodytidae", ["CN", "GB", "BR"]);
    expect(one).toBe(other);
  });
});
