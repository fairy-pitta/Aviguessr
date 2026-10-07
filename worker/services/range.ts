import { COUNTRY_NAMES } from "../data/countries";
import { REGIONS } from "../data/regions";

/**
 * One line describing where a bird lives, for the page shown after a guess.
 *
 * This is computed from the country list rather than read from
 * birds.range_description, because that column was only ever filled for the
 * original 939-species sample: two thirds of the species the game can now
 * show would have an empty learning panel. The country list is in hand by
 * the time the round is scored, so the sentence costs nothing to build and
 * covers every species in the world list.
 */
export function describeRange(countryCodes: string[]): string | null {
  // `XX` stands for a record no country could be assigned to.
  const codes = countryCodes.filter((c) => c in REGIONS || c in COUNTRY_NAMES);
  if (codes.length === 0) return null;

  const nameOf = (code: string) => COUNTRY_NAMES[code] ?? code;

  if (codes.length === 1) return `Endemic to ${nameOf(codes[0])}`;
  if (codes.length <= 3) return `Found in ${codes.map(nameOf).join(", ")}`;

  const continents = unique(codes.map((c) => REGIONS[c]?.continent));
  const subregions = unique(codes.map((c) => REGIONS[c]?.subregion));

  if (continents.length === 1 && subregions.length === 1) {
    return `Found across ${subregions[0]} (${codes.length} countries)`;
  }
  if (continents.length === 1) {
    return `Distributed across ${continents[0]} (${codes.length} countries)`;
  }
  if (continents.length === 0) {
    return `Found in ${codes.length} countries`;
  }
  return `Wide range across ${listOf(continents)} (${codes.length} countries)`;
}

function unique(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))];
}

/** "Europe, Africa and Asia" — a list a person would read aloud. */
function listOf(values: string[]): string {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}
