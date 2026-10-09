import { describe, it, expect } from "vitest";
import { questionName, REDACTION } from "../services/species-name";

describe("questionName", () => {
  it("test_question_name_without_a_place_word_is_shown_whole", () => {
    // The case the name is shown for: two quetzals a photograph cannot separate
    expect(questionName("Crested Quetzal", 5)).toBe("Crested Quetzal");
    expect(questionName("Resplendent Quetzal", 7)).toBe("Resplendent Quetzal");
  });

  it("test_question_name_of_a_wide_ranging_bird_keeps_its_place_word", () => {
    // "Eurasian" across 151 countries points at nothing a player can click
    expect(questionName("Eurasian Kestrel", 151)).toBe("Eurasian Kestrel");
  });

  it("test_question_name_of_a_narrow_ranging_bird_inks_out_the_place", () => {
    expect(questionName("Australian Brushturkey", 1)).toBe(
      `${REDACTION} Brushturkey`
    );
    expect(questionName("Japanese Robin", 2)).toBe(`${REDACTION} Robin`);
  });

  it("test_question_name_inks_out_a_place_inside_a_longer_name", () => {
    expect(questionName("Black-headed Siberian Jay", 3)).toBe(
      `Black-headed ${REDACTION} Jay`
    );
  });

  it("test_question_name_inks_out_every_place_word_it_finds", () => {
    expect(questionName("African Pacific Swift", 4)).toBe(
      `${REDACTION} ${REDACTION} Swift`
    );
  });

  it("test_question_name_matches_a_place_word_whatever_its_case", () => {
    expect(questionName("JAPANESE ROBIN", 2)).toBe(`${REDACTION} ROBIN`);
  });

  it("test_question_name_leaves_a_place_word_inside_another_word_alone", () => {
    // "Indian" must not strike the "indian" in a longer word
    expect(questionName("Scandinavian Pipit", 2)).toBe("Scandinavian Pipit");
  });

  it("test_question_name_at_the_width_where_a_place_stops_pointing", () => {
    expect(questionName("African Jacana", 19)).toBe(`${REDACTION} Jacana`);
    expect(questionName("African Jacana", 20)).toBe("African Jacana");
  });
});
