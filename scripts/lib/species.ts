/**
 * Turning the eBird taxonomy and the per-country species lists into the
 * reference rows the game plays from.
 *
 * Both inputs are already on disk, so building the world list needs no
 * network: data/_cache_taxonomy.json (17,891 taxa) and
 * data/_cache_species_country_map.json (species code -> country codes).
 */

export type TaxonomyEntry = {
  speciesCode: string;
  comName: string;
  sciName: string;
  /** eBird mixes subspecies, hybrids and "sp." groups in with true species. */
  category: string;
  order: string;
  familyComName: string;
  familySciName: string;
};

export type Difficulty = "easy" | "medium" | "hard";

export type SpeciesRow = {
  speciesCode: string;
  name: string;
  scientificName: string;
  genus: string;
  /**
   * The English group noun, which in bird naming convention is the last word
   * of the common name: "Barred Antshrike" is an antshrike. This gives a rung
   * of the identification ladder between family and species for free, and it
   * is the vocabulary people actually reach for.
   */
  groupWord: string;
  family: string;
  familySci: string;
  taxonOrder: string;
  countries: string[];
  rangeSize: number;
  difficulty: Difficulty;
};

export function groupWord(commonName: string): string {
  const parts = commonName.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

export function genusOf(scientificName: string): string {
  return scientificName.trim().split(/\s+/)[0];
}

/** Range breadth, which is the only difficulty signal the data supports. */
export function difficultyFor(rangeSize: number): Difficulty {
  if (rangeSize <= 3) return "hard";
  if (rangeSize <= 10) return "medium";
  return "easy";
}

export function buildSpeciesRows(
  taxonomy: TaxonomyEntry[],
  countryMap: Record<string, string[]>
): SpeciesRow[] {
  const seen = new Set<string>();
  const rows: SpeciesRow[] = [];

  for (const entry of taxonomy) {
    if (entry.category !== "species") continue;
    if (seen.has(entry.speciesCode)) {
      throw new Error(`duplicate species code: ${entry.speciesCode}`);
    }
    seen.add(entry.speciesCode);

    const countries = countryMap[entry.speciesCode] ?? [];
    rows.push({
      speciesCode: entry.speciesCode,
      name: entry.comName,
      scientificName: entry.sciName,
      genus: genusOf(entry.sciName),
      groupWord: groupWord(entry.comName),
      family: entry.familyComName,
      familySci: entry.familySciName,
      taxonOrder: entry.order,
      countries,
      rangeSize: countries.length,
      difficulty: difficultyFor(countries.length),
    });
  }

  return rows;
}

/**
 * A checkpoint entry records how many observations the host reported, and
 * uses -1 to mean the request never got an answer.
 */
export type CollectedEntry = { total: number };

/**
 * The species a resumed run still has to fetch.
 *
 * A failed request and a species the host genuinely has no usable photograph
 * of both land in the checkpoint with no candidates, and treating them alike
 * is how a throttled afternoon turns into thousands of birds permanently
 * recorded as unphotographed. Only a request that was actually answered
 * counts as done.
 */
export function pendingSpecies<T extends CollectedEntry>(
  species: SpeciesRow[],
  done: Record<string, T>
): SpeciesRow[] {
  return species.filter((s) => {
    const entry = done[s.speciesCode];
    return entry === undefined || entry.total === -1;
  });
}
