import { photographer } from "./image-sources";

/**
 * Choosing a photograph good enough to be a plate.
 *
 * Only the floors live here, because they are the part that can be decided
 * from metadata. Measuring 33 photographs showed that the cheap image metrics
 * do not answer the question that matters: Laplacian variance ranked a flock
 * of sparrows, a nest of chicks and a bird beside a human foot as the three
 * sharpest pictures in the sample, because it measures detail density rather
 * than whether there is one bird, large in frame and unobstructed. So the
 * floors here reject what is measurable and leave the judgement to a vision
 * pass over the candidates this produces.
 */

/**
 * Non-commercial licences are included. Restricted to the openly licensed
 * subset, obscure species have one to three research-grade photographs each,
 * which is too few to apply any quality bar at all; including NC multiplies
 * the pool roughly sevenfold. Each candidate records which licence it carries
 * so an openly licensed set can be filtered back out later.
 */
export const LICENCE_LABELS: Record<string, string> = {
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
  "cc-by-nc": "CC BY-NC",
  "cc-by-nc-sa": "CC BY-NC-SA",
};

/** Licences that also permit commercial use. */
export const COMMERCIAL = new Set(["CC0", "CC BY", "CC BY-SA"]);

/**
 * The plate is shown full bleed across half of a large screen, so it is served
 * at 1024px. Anything whose original is smaller than that would be upscaled.
 */
export const MIN_LONG_SIDE = 1024;

/** A panorama crops to nothing useful in a portrait plate. */
export const MAX_ASPECT = 2;

/*
 * iNaturalist's annotation vocabulary, fetched from /v1/controlled_terms
 * rather than guessed. These are what keep specimens out: a skeleton is
 * annotated Evidence of Presence = Bone, and it sailed through licence,
 * vote-rank and resolution filters in the first screening sheet.
 */
const TERM_ALIVE_OR_DEAD = 17;
const VALUE_DEAD = 19;
const TERM_LIFE_STAGE = 1;
const VALUE_EGG = 7;
const VALUE_JUVENILE = 8;
const TERM_EVIDENCE = 22;
const VALUE_ORGANISM = 24;

export type InatPhoto = {
  id: number;
  url: string;
  license_code: string | null;
  attribution: string;
  original_dimensions?: { width: number; height: number };
};

export type InatAnnotation = {
  controlled_attribute_id: number;
  controlled_value_id: number;
};

export type InatObservation = {
  quality_grade: string;
  faves_count?: number;
  captive?: boolean;
  annotations?: InatAnnotation[];
  taxon?: { id: number; name: string };
  user?: { name?: string; login?: string };
  photos?: InatPhoto[];
};

export type Candidate = {
  photoId: number;
  url: string;
  license: string;
  commercial: boolean;
  artist: string;
  faves: number;
  width: number;
  height: number;
  /** Juvenile plumage differs from the adult, so these rank last. */
  juvenile: boolean;
};

/**
 * Whether the observation shows a living whole bird. Unannotated observations
 * pass: most carry no annotations at all, so requiring one would discard the
 * majority of the pool. Only an explicit bad annotation rejects.
 */
function showsALivingBird(obs: InatObservation): boolean {
  if (obs.captive) return false;

  for (const a of obs.annotations ?? []) {
    const { controlled_attribute_id: term, controlled_value_id: value } = a;
    if (term === TERM_ALIVE_OR_DEAD && value === VALUE_DEAD) return false;
    if (term === TERM_LIFE_STAGE && value === VALUE_EGG) return false;
    // Feather, bone, scat, track, moult, nest: evidence, not a bird
    if (term === TERM_EVIDENCE && value !== VALUE_ORGANISM) return false;
  }

  return true;
}

function isJuvenile(obs: InatObservation): boolean {
  return (obs.annotations ?? []).some(
    (a) =>
      a.controlled_attribute_id === TERM_LIFE_STAGE &&
      a.controlled_value_id === VALUE_JUVENILE
  );
}

export function passesFloors(photo: InatPhoto): boolean {
  const d = photo.original_dimensions;
  if (!d?.width || !d?.height) return false;
  if (Math.max(d.width, d.height) < MIN_LONG_SIDE) return false;
  return Math.max(d.width, d.height) / Math.min(d.width, d.height) <= MAX_ASPECT;
}

/**
 * Candidates from a page of observations, in the order the API ranked them
 * (which is by votes), with the floors applied. The caller screens these.
 */
export function photoCandidates(
  observations: InatObservation[],
  scientificName: string
): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];

  for (const obs of observations) {
    if (obs.quality_grade !== "research") continue;
    // A misidentified or genus-level observation is not a plate of this species
    if (obs.taxon?.name !== scientificName) continue;
    if (!showsALivingBird(obs)) continue;

    for (const photo of obs.photos ?? []) {
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
        artist: photographer(photo.attribution ?? "", obs.user),
        faves: obs.faves_count ?? 0,
        width: d.width,
        height: d.height,
        juvenile: isJuvenile(obs),
      });
    }
  }

  // Stable partition: the API's vote order is kept within each group
  return [...out.filter((c) => !c.juvenile), ...out.filter((c) => c.juvenile)];
}
