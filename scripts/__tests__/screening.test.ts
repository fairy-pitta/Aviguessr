import { describe, it, expect } from "vitest";
import { mergeVerdicts, chosenPhotos } from "../lib/screening";
import type { Candidate } from "../lib/photo-quality";

const manifest = [
  { cell: 1, speciesCode: "a", url: "https://e/1/large.jpg" },
  { cell: 2, speciesCode: "b", url: "https://e/2/large.jpg" },
];

const candidate = (url: string, over: Partial<Candidate> = {}): Candidate => ({
  photoId: 1,
  url,
  license: "CC BY-NC",
  commercial: false,
  artist: "Someone",
  faves: 0,
  width: 2048,
  height: 1365,
  juvenile: false,
  ...over,
});

describe("mergeVerdicts", () => {
  it("test_merge_records_each_verdict_against_its_species_and_url", () => {
    const merged = mergeVerdicts({}, manifest, [
      { cell: 1, ok: true },
      { cell: 2, ok: false, reason: "flock" },
    ]);
    expect(merged.a).toEqual([{ url: "https://e/1/large.jpg", ok: true, reason: undefined }]);
    expect(merged.b).toEqual([{ url: "https://e/2/large.jpg", ok: false, reason: "flock" }]);
  });

  it("test_merge_ignores_a_cell_the_manifest_does_not_have", () => {
    expect(mergeVerdicts({}, manifest, [{ cell: 9, ok: true }])).toEqual({});
  });

  it("test_merge_keeps_an_earlier_verdict_for_the_same_photo", () => {
    const first = mergeVerdicts({}, manifest, [{ cell: 1, ok: false, reason: "hand" }]);
    const again = mergeVerdicts(first, manifest, [{ cell: 1, ok: true }]);
    expect(again.a).toHaveLength(1);
    expect(again.a[0].ok).toBe(false);
  });

  it("test_merge_appends_a_second_candidate_for_the_same_species", () => {
    const first = mergeVerdicts({}, manifest, [{ cell: 1, ok: false, reason: "hand" }]);
    const next = mergeVerdicts(
      first,
      [{ cell: 1, speciesCode: "a", url: "https://e/9/large.jpg" }],
      [{ cell: 1, ok: true }]
    );
    expect(next.a.map((v) => v.ok)).toEqual([false, true]);
  });
});

describe("chosenPhotos", () => {
  const candidates = {
    a: { candidates: [candidate("https://e/1/large.jpg"), candidate("https://e/9/large.jpg")] },
    b: { candidates: [candidate("https://e/2/large.jpg")] },
  };

  it("test_chosen_returns_the_first_accepted_candidate", () => {
    const chosen = chosenPhotos(
      { a: [{ url: "https://e/1/large.jpg", ok: false }, { url: "https://e/9/large.jpg", ok: true }] },
      candidates
    );
    expect(chosen).toHaveLength(1);
    expect(chosen[0].url).toBe("https://e/9/large.jpg");
  });

  it("test_chosen_omits_a_species_with_nothing_accepted", () => {
    expect(chosenPhotos({ b: [{ url: "https://e/2/large.jpg", ok: false }] }, candidates)).toEqual([]);
  });

  it("test_chosen_prefers_the_earliest_accepted_candidate", () => {
    // Both pass the screen, and the earlier one was ranked higher for a reason
    const chosen = chosenPhotos(
      { a: [{ url: "https://e/1/large.jpg", ok: true }, { url: "https://e/9/large.jpg", ok: true }] },
      candidates
    );
    expect(chosen[0].url).toBe("https://e/1/large.jpg");
  });

  it("test_chosen_carries_the_licence_through", () => {
    const [c] = chosenPhotos({ b: [{ url: "https://e/2/large.jpg", ok: true }] }, candidates);
    expect(c.license).toBe("CC BY-NC");
    expect(c.commercial).toBe(false);
  });
});
