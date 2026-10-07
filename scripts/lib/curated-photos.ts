/**
 * Candidates from a species' own page rather than from observations of it.
 *
 * iNaturalist is a record of what people saw, so an observation photograph
 * only has to prove the bird was there: a speck on a mudflat, a bird in the
 * hand at a ringing station and a shot of the habitat it was calling from are
 * all perfectly good records. Screening 1,240 of them by eye accepted 59%.
 *
 * The photographs on a taxon page are a different set, chosen by curators to
 * represent the species. Screened the same way, by the same eye, against the
 * same bar, 90 species accepted at 96% — and not one of the rejects was a
 * mammal, a flock, a held bird or an empty frame.
 *
 * They are also far cheaper: a taxon page carries every photograph at once and
 * thirty taxa fetch in a single request, where observations cost one request
 * per species.
 *
 * What is given up is the annotation filter. A taxon photograph carries no
 * observation behind it, so there is nothing recording dead, captive, egg or
 * juvenile. The measured acceptance rate says the curators already hold that
 * line.
 */
import {
  COMMERCIAL,
  LICENCE_LABELS,
  passesFloors,
  type Candidate,
  type InatPhoto,
} from "./photo-quality";
import { photographer } from "./image-sources";

export type InatTaxon = {
  id: number;
  name: string;
  preferred_common_name?: string;
  taxon_photos?: { photo: InatPhoto }[];
};

/**
 * The usable photographs of a taxon, in the order the curators put them. That
 * order is the one signal here worth keeping: the first photograph on a taxon
 * page is the one chosen to stand for the species.
 */
export function curatedCandidates(taxon: InatTaxon): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];

  for (const entry of taxon.taxon_photos ?? []) {
    const photo = entry.photo;
    if (!photo) continue;

    const license = photo.license_code
      ? LICENCE_LABELS[photo.license_code]
      : undefined;
    if (!license) continue;
    if (!passesFloors(photo)) continue;

    const url = photo.url.replace(/\/square\./, "/large.");
    if (seen.has(url)) continue;
    seen.add(url);

    const d = photo.original_dimensions!;
    out.push({
      photoId: photo.id,
      url,
      license,
      commercial: COMMERCIAL.has(license),
      artist: photographer(photo.attribution ?? "", undefined),
      // A taxon photograph carries no votes and no life-stage annotation.
      faves: 0,
      width: d.width,
      height: d.height,
      juvenile: false,
    });
  }

  return out;
}
