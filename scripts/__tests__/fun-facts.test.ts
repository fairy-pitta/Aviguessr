import { describe, it, expect } from "vitest";
import { firstSentence, pickFunFact, titleCandidates } from "../lib/fun-facts";

describe("titleCandidates", () => {
  it("test_title_candidates_prefers_scientific_name_over_common_name", () => {
    expect(titleCandidates("Fulvetta cinereiceps", "Gray-hooded Fulvetta")).toEqual([
      "Fulvetta cinereiceps",
      "Gray-hooded Fulvetta",
    ]);
  });

  it("test_title_candidates_with_duplicate_names_returns_one_entry", () => {
    expect(titleCandidates("Vanellus vanellus", "Vanellus vanellus")).toEqual([
      "Vanellus vanellus",
    ]);
  });

  it("test_title_candidates_drops_subspecies_trinomial_to_species", () => {
    expect(titleCandidates("Parus major major", "Great Tit")).toEqual([
      "Parus major major",
      "Parus major",
      "Great Tit",
    ]);
  });
});

describe("firstSentence", () => {
  it("test_first_sentence_with_multiple_sentences_returns_only_the_first", () => {
    expect(firstSentence("It is a passerine bird. It breeds in Asia.")).toBe(
      "It is a passerine bird."
    );
  });

  it("test_first_sentence_with_binomial_abbreviation_does_not_split_early", () => {
    expect(
      firstSentence("The species was described by C. W. Richmond in 1902. Later work moved it.")
    ).toBe("The species was described by C. W. Richmond in 1902.");
  });

  it("test_first_sentence_without_terminator_returns_whole_text", () => {
    expect(firstSentence("A small brown bird")).toBe("A small brown bird");
  });

  it("test_first_sentence_with_empty_text_returns_empty_string", () => {
    expect(firstSentence("   ")).toBe("");
  });
});

describe("pickFunFact", () => {
  it("test_pick_fun_fact_with_useful_extract_returns_first_sentence", () => {
    const extract =
      "The gray-hooded fulvetta is a bird species in the family Paradoxornithidae. It is found in China.";
    expect(pickFunFact(extract)).toBe(
      "The gray-hooded fulvetta is a bird species in the family Paradoxornithidae."
    );
  });

  it("test_pick_fun_fact_with_disambiguation_extract_returns_null", () => {
    expect(
      pickFunFact("Fulvetta may refer to several birds. See also the list below.")
    ).toBeNull();
  });

  it("test_pick_fun_fact_with_too_short_extract_returns_null", () => {
    expect(pickFunFact("A bird.")).toBeNull();
  });

  it("test_pick_fun_fact_with_overlong_sentence_truncates_at_word_boundary", () => {
    const long = `The bird ${"very ".repeat(60)}long name.`;
    const fact = pickFunFact(long);
    expect(fact).not.toBeNull();
    expect(fact!.length).toBeLessThanOrEqual(240);
    expect(fact!.endsWith("…")).toBe(true);
    expect(fact).not.toMatch(/ver…$/);
  });

  it("test_pick_fun_fact_with_empty_extract_returns_null", () => {
    expect(pickFunFact("")).toBeNull();
  });
});
