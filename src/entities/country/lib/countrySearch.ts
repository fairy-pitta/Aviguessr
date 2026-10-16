export type CountryMatch = { code: string; name: string };

/** How many suggestions a player can take in without scanning a list. */
const LIMIT = 8;

/**
 * Lower case, unaccented, letters and digits only — so "cote" finds
 * Côte d'Ivoire and "ivoire" finds it too.
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The countries worth offering for what the player has typed.
 *
 * Picking a country by clicking its shape means zooming to it first, which
 * is a fight on a phone and impossible to do quickly for Luxembourg or
 * Singapore. Typing the name is the way in that does not depend on how big
 * the country is; the map is then for seeing where the answer lands.
 *
 * A name that starts with the query comes before one that merely contains
 * it, and a word inside the name counts as a start — "rica" finds Costa
 * Rica — because that is how people half-remember a country.
 */
export function matchCountries(
  query: string,
  names: Record<string, string>
): CountryMatch[] {
  const q = fold(query);
  if (!q) return [];

  const scored: { match: CountryMatch; rank: number }[] = [];

  for (const [code, name] of Object.entries(names)) {
    const folded = fold(name);
    if (folded.startsWith(q)) scored.push({ match: { code, name }, rank: 0 });
    else if (folded.split(" ").some((word) => word.startsWith(q)))
      scored.push({ match: { code, name }, rank: 1 });
    else if (folded.includes(q)) scored.push({ match: { code, name }, rank: 2 });
  }

  return scored
    .sort((a, b) => a.rank - b.rank || a.match.name.localeCompare(b.match.name))
    .slice(0, LIMIT)
    .map((s) => s.match);
}
