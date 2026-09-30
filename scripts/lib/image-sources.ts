/**
 * Image source selection for the bird dataset.
 *
 * The original collector took the first CC/PD hit from a Commons full-text
 * search without looking at what the file was. A visual audit of all 939
 * images found only 35% showed a living bird: 234 had no bird at all
 * (distribution maps, and one audio-file icon shared by 98 species), 174 were
 * hand-coloured plates, 108 were museum study skins and 63 were book scans.
 *
 * iNaturalist research-grade observations are photographs of living organisms
 * whose identification other people have confirmed, so they are the primary
 * source here. Commons stays as a fallback, but only for files that survive
 * the filters below.
 */

const MIN_DIMENSION = 400;

/** Licenses we can use. Non-commercial variants are excluded on purpose. */
const PERMISSIVE_COMMONS = /^(CC0|CC BY(-SA)?(\s|$)|Public domain|PD)/i;
const NONCOMMERCIAL = /NC/i;

const INAT_LICENSE_LABELS: Record<string, string> = {
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
};

/** File-name signatures of the things the audit found instead of bird photos. */
const REJECT_PATTERNS: RegExp[] = [
  /fileicon/i, // the shared audio-file icon
  /\.(pdf|djvu)/i, // page scans of books and journals
  /\.(png|svg|gif|tiff?)(\?|$)/i, // originals in these formats are maps and icons
  /Naturalis_Biodiversity|RMNH|ZMA\.AVES|MNHN|NHMUK/i, // museum specimen series
  /study_skins?|specimen|taxiderm/i,
  /distribution|_map\b|\bmap_|range_map/i,
  /iconograph|iconographie|monograph|_plate|plate_|tafel/i,
  /lithograph|engraving|_print_|painting/i,
  /federal_register|proceedings|novitates|bulletin|magazine|journal_of/i,
  /stamp|banknote|postage/i,
];

export type CommonsFile = {
  url: string;
  license: string;
  width: number;
  height: number;
};

/**
 * Whether a Commons file is plausibly a photograph of a live bird.
 * Conservative by design: it is better to drop a species than to serve a map.
 */
export function isUsableCommonsFile(file: CommonsFile): boolean {
  if (Math.min(file.width, file.height) < MIN_DIMENSION) return false;
  if (NONCOMMERCIAL.test(file.license)) return false;
  if (!PERMISSIVE_COMMONS.test(file.license)) return false;

  // Judge the original file name, not the thumbnail wrapper Commons adds.
  const fileName = decodeURIComponent(file.url).split("/").slice(-2).join("/");
  return !REJECT_PATTERNS.some((p) => p.test(fileName));
}

export type InatPhoto = {
  url: string;
  license_code: string | null;
  attribution: string;
};

export type InatObservation = {
  quality_grade: string;
  taxon: { name: string } | null;
  photos: InatPhoto[];
};

export type PickedPhoto = {
  url: string;
  license: string;
  artist: string;
};

/** "(c) Cullen Hanks, some rights reserved (CC BY)" -> "Cullen Hanks" */
function photographer(attribution: string): string {
  return attribution
    .replace(/^\(c\)\s*/i, "")
    .split(",")[0]
    .replace(/\s*\(.*\)\s*$/, "")
    .trim();
}

/**
 * First observation that is research-grade, identified as exactly `scientificName`,
 * and carries a permissively licensed photo not already claimed by another
 * species. Returns null when none qualifies.
 *
 * `usedUrls` exists because the previous dataset handed the same file to 98
 * species; a photo is never reused, even if it is the only permissive one.
 */
export function pickInatPhoto(
  observations: InatObservation[],
  scientificName: string,
  usedUrls: Set<string> = new Set()
): PickedPhoto | null {
  for (const obs of observations) {
    if (obs.quality_grade !== "research") continue;
    if (obs.taxon?.name !== scientificName) continue;

    for (const photo of obs.photos ?? []) {
      const label = photo.license_code
        ? INAT_LICENSE_LABELS[photo.license_code]
        : undefined;
      if (!label) continue;

      const url = photo.url.replace("/square.", "/medium.");
      if (usedUrls.has(url)) continue;

      return {
        url,
        license: label,
        artist: photographer(photo.attribution),
      };
    }
  }

  return null;
}
