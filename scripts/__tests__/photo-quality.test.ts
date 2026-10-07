import { describe, it, expect } from "vitest";
import {
  LICENCE_LABELS,
  photoCandidates,
  type InatObservation,
} from "../lib/photo-quality";

const photo = (over: Record<string, unknown> = {}) => ({
  id: 1,
  url: "https://example.org/photos/1/square.jpg",
  license_code: "cc-by",
  attribution: "(c) Someone, some rights reserved",
  original_dimensions: { width: 2048, height: 1365 },
  ...over,
});

const obs = (over: Partial<InatObservation> = {}): InatObservation =>
  ({
    quality_grade: "research",
    faves_count: 3,
    taxon: { id: 7, name: "Hirundo rustica" },
    user: { name: "Someone", login: "someone" },
    photos: [photo()],
    ...over,
  }) as InatObservation;

describe("photoCandidates", () => {
  it("test_candidates_rewrites_the_url_to_the_large_size", () => {
    const [c] = photoCandidates([obs()], "Hirundo rustica");
    expect(c.url).toBe("https://example.org/photos/1/large.jpg");
  });

  it("test_candidates_drops_a_photo_below_the_resolution_floor", () => {
    const small = obs({
      photos: [photo({ original_dimensions: { width: 404, height: 404 } })],
    });
    expect(photoCandidates([small], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_drops_an_extreme_aspect_ratio", () => {
    const wide = obs({
      photos: [photo({ original_dimensions: { width: 4000, height: 1000 } })],
    });
    expect(photoCandidates([wide], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_drops_a_licence_that_is_not_allowed", () => {
    const nd = obs({ photos: [photo({ license_code: "cc-by-nd" })] });
    expect(photoCandidates([nd], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_keeps_a_non_commercial_licence", () => {
    const nc = obs({ photos: [photo({ license_code: "cc-by-nc" })] });
    const [c] = photoCandidates([nc], "Hirundo rustica");
    expect(c.license).toBe(LICENCE_LABELS["cc-by-nc"]);
    expect(c.commercial).toBe(false);
  });

  it("test_candidates_marks_an_open_licence_as_commercial", () => {
    const [c] = photoCandidates([obs()], "Hirundo rustica");
    expect(c.commercial).toBe(true);
  });

  it("test_candidates_drops_an_observation_of_a_different_species", () => {
    const other = obs({ taxon: { id: 9, name: "Hirundo neoxena" } });
    expect(photoCandidates([other], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_drops_an_observation_that_is_not_research_grade", () => {
    const needsId = obs({ quality_grade: "needs_id" });
    expect(photoCandidates([needsId], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_preserves_the_order_the_api_ranked_them_in", () => {
    const list = [
      obs({ faves_count: 9, photos: [photo({ id: 1, url: "https://e/1/square.jpg" })] }),
      obs({ faves_count: 2, photos: [photo({ id: 2, url: "https://e/2/square.jpg" })] }),
    ];
    expect(photoCandidates(list, "Hirundo rustica").map((c) => c.faves)).toEqual([9, 2]);
  });

  it("test_candidates_drops_a_duplicate_photo_url", () => {
    const twice = [obs(), obs()];
    expect(photoCandidates(twice, "Hirundo rustica")).toHaveLength(1);
  });

  it("test_candidates_names_the_photographer", () => {
    const [c] = photoCandidates([obs()], "Hirundo rustica");
    expect(c.artist).toBe("Someone");
  });
});

describe("photoCandidates annotations", () => {
  const annotated = (pairs: [number, number][]) =>
    obs({
      annotations: pairs.map(([a, v]) => ({
        controlled_attribute_id: a,
        controlled_value_id: v,
      })),
    } as Partial<InatObservation>);

  it("test_candidates_drops_an_observation_annotated_dead", () => {
    expect(photoCandidates([annotated([[17, 19]])], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_drops_evidence_that_is_not_the_organism", () => {
    // 22 = Evidence of Presence, 27 = Bone. This is how a skeleton gets in.
    expect(photoCandidates([annotated([[22, 27]])], "Hirundo rustica")).toEqual([]);
    expect(photoCandidates([annotated([[22, 23]])], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_keeps_evidence_annotated_as_the_organism", () => {
    expect(photoCandidates([annotated([[22, 24]])], "Hirundo rustica")).toHaveLength(1);
  });

  it("test_candidates_drops_an_egg", () => {
    expect(photoCandidates([annotated([[1, 7]])], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_drops_a_captive_observation", () => {
    const zoo = obs({ captive: true } as Partial<InatObservation>);
    expect(photoCandidates([zoo], "Hirundo rustica")).toEqual([]);
  });

  it("test_candidates_keeps_an_unannotated_observation", () => {
    expect(photoCandidates([annotated([])], "Hirundo rustica")).toHaveLength(1);
  });

  it("test_candidates_ranks_juveniles_after_adults", () => {
    const juvenile = obs({
      faves_count: 99,
      annotations: [{ controlled_attribute_id: 1, controlled_value_id: 8 }],
      photos: [photo({ id: 1, url: "https://e/1/square.jpg" })],
    } as Partial<InatObservation>);
    const adult = obs({
      faves_count: 1,
      photos: [photo({ id: 2, url: "https://e/2/square.jpg" })],
    });
    const ranked = photoCandidates([juvenile, adult], "Hirundo rustica");
    expect(ranked.map((c) => c.juvenile)).toEqual([false, true]);
  });
});
