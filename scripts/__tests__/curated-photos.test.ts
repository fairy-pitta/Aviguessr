import { describe, it, expect } from "vitest";
import { curatedCandidates, type InatTaxon } from "../lib/curated-photos";

/** Distinct photos carry distinct urls, so the url follows the id. */
const photo = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  url: `https://inaturalist-open-data.s3.amazonaws.com/photos/${over.id ?? 1}/square.jpg`,
  license_code: "cc-by",
  attribution: "(c) Ada Lovelace, some rights reserved (CC BY)",
  original_dimensions: { width: 2000, height: 1500 },
  ...over,
});

const taxon = (photos: unknown[]): InatTaxon =>
  ({ id: 3947, name: "Limosa limosa", taxon_photos: photos.map((p) => ({ photo: p })) }) as InatTaxon;

describe("curatedCandidates", () => {
  it("test_curated_keeps_the_order_the_curators_chose", () => {
    const out = curatedCandidates(
      taxon([photo({ id: 1 }), photo({ id: 2 }), photo({ id: 3 })])
    );

    expect(out.map((c) => c.photoId)).toEqual([1, 2, 3]);
  });

  it("test_curated_serves_the_large_rendition_not_the_square_crop", () => {
    const [c] = curatedCandidates(taxon([photo()]));

    expect(c.url).toBe(
      "https://inaturalist-open-data.s3.amazonaws.com/photos/1/large.jpg"
    );
  });

  it("test_curated_drops_a_photo_with_no_usable_licence", () => {
    const out = curatedCandidates(
      taxon([photo({ id: 1, license_code: null }), photo({ id: 2, license_code: "c" })])
    );

    expect(out).toEqual([]);
  });

  it("test_curated_drops_a_photo_below_the_plate_resolution", () => {
    const out = curatedCandidates(
      taxon([photo({ original_dimensions: { width: 800, height: 600 } })])
    );

    expect(out).toEqual([]);
  });

  it("test_curated_drops_a_panorama", () => {
    const out = curatedCandidates(
      taxon([photo({ original_dimensions: { width: 4000, height: 1000 } })])
    );

    expect(out).toEqual([]);
  });

  it("test_curated_drops_a_photo_repeated_in_the_list", () => {
    const out = curatedCandidates(taxon([photo({ id: 1 }), photo({ id: 1 })]));

    expect(out).toHaveLength(1);
  });

  it("test_curated_records_whether_the_licence_allows_commercial_use", () => {
    const [free, nc] = curatedCandidates(
      taxon([
        photo({ id: 1, license_code: "cc-by" }),
        photo({ id: 2, license_code: "cc-by-nc" }),
      ])
    );

    expect(free.commercial).toBe(true);
    expect(nc.commercial).toBe(false);
  });

  it("test_curated_names_the_photographer", () => {
    const [c] = curatedCandidates(taxon([photo()]));

    expect(c.artist).toBe("Ada Lovelace");
  });

  it("test_curated_with_no_photos_returns_nothing", () => {
    expect(curatedCandidates({ id: 1, name: "x" } as InatTaxon)).toEqual([]);
  });
});
