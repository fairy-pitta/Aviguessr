import { describe, it, expect } from "vitest";
import { groupWord, genusOf, difficultyFor, buildSpeciesRows, type TaxonomyEntry, pendingSpecies, type SpeciesRow } from "../lib/species";

describe("groupWord", () => {
  it("test_group_word_of_two_word_name_returns_the_last_word", () => {
    expect(groupWord("Barred Antshrike")).toBe("antshrike");
  });

  it("test_group_word_keeps_a_hyphenated_compound_whole", () => {
    expect(groupWord("Christmas Island White-eye")).toBe("white-eye");
  });

  it("test_group_word_of_a_possessive_name_returns_the_group", () => {
    expect(groupWord("Swinhoe's Storm-Petrel")).toBe("storm-petrel");
  });

  it("test_group_word_of_single_word_name_returns_that_word", () => {
    expect(groupWord("Hoopoe")).toBe("hoopoe");
  });
});

describe("genusOf", () => {
  it("test_genus_of_binomial_returns_the_first_word", () => {
    expect(genusOf("Fulvetta cinereiceps")).toBe("Fulvetta");
  });
});

describe("difficultyFor", () => {
  it("test_difficulty_of_narrow_range_is_hard", () => {
    expect(difficultyFor(1)).toBe("hard");
    expect(difficultyFor(3)).toBe("hard");
  });

  it("test_difficulty_of_middling_range_is_medium", () => {
    expect(difficultyFor(4)).toBe("medium");
    expect(difficultyFor(10)).toBe("medium");
  });

  it("test_difficulty_of_widespread_range_is_easy", () => {
    expect(difficultyFor(11)).toBe("easy");
    expect(difficultyFor(237)).toBe("easy");
  });
});

const entry = (over: Partial<TaxonomyEntry>): TaxonomyEntry => ({
  speciesCode: "x1",
  comName: "Barred Antshrike",
  sciName: "Thamnophilus doliatus",
  category: "species",
  order: "Passeriformes",
  familyComName: "Typical Antbirds",
  familySciName: "Thamnophilidae",
  ...over,
});

describe("buildSpeciesRows", () => {
  it("test_build_rows_drops_everything_that_is_not_a_species", () => {
    const rows = buildSpeciesRows(
      [
        entry({ speciesCode: "a" }),
        entry({ speciesCode: "b", category: "issf" }),
        entry({ speciesCode: "c", category: "hybrid" }),
        entry({ speciesCode: "d", category: "slash" }),
      ],
      {}
    );
    expect(rows.map((r) => r.speciesCode)).toEqual(["a"]);
  });

  it("test_build_rows_joins_the_range_and_counts_it", () => {
    const [row] = buildSpeciesRows([entry({ speciesCode: "a" })], {
      a: ["BR", "CO", "PE", "EC"],
    });
    expect(row.countries).toEqual(["BR", "CO", "PE", "EC"]);
    expect(row.rangeSize).toBe(4);
    expect(row.difficulty).toBe("medium");
  });

  it("test_build_rows_keeps_a_species_with_no_known_range", () => {
    const [row] = buildSpeciesRows([entry({ speciesCode: "a" })], {});
    expect(row.countries).toEqual([]);
    expect(row.rangeSize).toBe(0);
  });

  it("test_build_rows_derives_the_taxonomic_ladder", () => {
    const [row] = buildSpeciesRows([entry({ speciesCode: "a" })], {});
    expect(row.genus).toBe("Thamnophilus");
    expect(row.groupWord).toBe("antshrike");
    expect(row.familySci).toBe("Thamnophilidae");
    expect(row.taxonOrder).toBe("Passeriformes");
  });

  it("test_build_rows_rejects_duplicate_species_codes", () => {
    expect(() =>
      buildSpeciesRows(
        [entry({ speciesCode: "a" }), entry({ speciesCode: "a" })],
        {}
      )
    ).toThrow(/duplicate/i);
  });
});

describe("pendingSpecies", () => {
  const row = (speciesCode: string) => ({ speciesCode }) as SpeciesRow;
  const all = [row("a"), row("b"), row("c"), row("d")];

  it("test_pending_with_an_empty_checkpoint_returns_every_species", () => {
    expect(pendingSpecies(all, {}).map((s) => s.speciesCode)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("test_pending_skips_a_species_that_was_collected", () => {
    const done = { b: { total: 120 } };

    expect(pendingSpecies(all, done).map((s) => s.speciesCode)).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  it("test_pending_skips_a_species_the_host_genuinely_had_none_of", () => {
    const done = { b: { total: 0 } };

    expect(pendingSpecies(all, done).map((s) => s.speciesCode)).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  it("test_pending_retries_a_species_whose_request_failed", () => {
    const done = { a: { total: 40 }, b: { total: -1 }, c: { total: 0 } };

    expect(pendingSpecies(all, done).map((s) => s.speciesCode)).toEqual([
      "b",
      "d",
    ]);
  });
});
