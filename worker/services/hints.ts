import { REGIONS } from "../data/regions";
import { COUNTRY_NAMES } from "../data/countries";

const NO_DATA = "No habitat data available";

/**
 * Builds the player-facing hint text for a bird's country list.
 * Level 1 reveals continents; level 2 is the family hint below.
 *
 * There is deliberately no level that names a correct country: the game asks
 * which country the bird lives in, so that hint was the answer itself.
 */
export function formatHint(countryCodes: string[], hintLevel: number): string {
  if (countryCodes.length === 0) {
    return NO_DATA;
  }

  if (hintLevel === 1) {
    const continents = [
      ...new Set(
        countryCodes
          .map((c) => REGIONS[c]?.continent)
          .filter((v): v is string => v != null && v !== "")
      ),
    ];
    return continents.length > 0
      ? `This bird lives in: ${continents.join(", ")}`
      : "Continent data unavailable";
  }

  if (hintLevel === 2) {
    const subregions = [
      ...new Set(
        countryCodes
          .map((c) => REGIONS[c]?.subregion)
          .filter((v): v is string => v != null && v !== "")
      ),
    ];
    return subregions.length > 0
      ? `Found in: ${subregions.join(", ")}`
      : "Subregion data unavailable";
  }

  return "Invalid hint level";
}

export async function getHintsForBird(
  db: D1Database,
  birdId: number,
  hintLevel: number
): Promise<string> {
  if (hintLevel === FAMILY_HINT_LEVEL) {
    const familyHint = await getFamilyHint(db, birdId);
    if (familyHint) return familyHint;
    // A bird with no family recorded falls back to the hint this replaced
  }

  const countries = await db
    .prepare("SELECT country_code FROM bird_countries WHERE bird_id = ?")
    .bind(birdId)
    .all<{ country_code: string }>();

  return formatHint(
    countries.results.map((r) => r.country_code),
    hintLevel
  );
}

/**
 * The hint that teaches something.
 *
 * Level two used to say "Found in: South-Eastern Asia", which narrows the map
 * and teaches nothing. The family is the thing that transfers: a player who
 * learns that tanagers are American places the next tanager unaided. Level
 * one stays the cheap, purely geographic option.
 */
export const FAMILY_HINT_LEVEL = 2;

/**
 * Fraction of the round's score each hint costs, by level.
 * Hints are opt-in, so the price is shown before the player commits.
 *
 * Level two is the family hint, whose price moves with how much the family
 * narrows the world — "Hawks and Eagles" is worth far less than a family
 * confined to one island. The entry here is what the median family costs,
 * which is also the fallback for a bird with no family recorded.
 */
export const HINT_PENALTIES = [0.15, 0.3];

/** The two prices for one round, level two priced by the bird's family. */
export function hintCostsForRound(familyCost: number | undefined): number[] {
  return [HINT_PENALTIES[0], familyCost ?? HINT_PENALTIES[1]];
}

/** The median family occupies this many countries, across all 251 of them. */
export const FAMILY_HINT_MEDIAN_RANGE = 32;

const COST_FLOOR = 0.12;
const COST_SPAN = 0.3;
/** Set so the median family costs what the hint it replaced cost flat. */
const COST_PIVOT = 48;

/**
 * What the family hint costs, by how much the family narrows the world.
 *
 * A flat price would sell "Hawks and Eagles — a family of every continent"
 * for the same 30% as a family confined to one island. Across the 251
 * families the count of countries occupied runs 1 to 252, median 32: a
 * one-country family costs 41%, the median 30%, the most cosmopolitan 17%.
 *
 * The same smooth curve as `rangeWeight`, for the same reason — no single
 * country added to a family's range should ever cost a player a step.
 *
 * A family with no countries recorded is a gap in the data rather than a
 * narrow family, and its hint goes out with no range clause at all, so it is
 * charged the floor instead of the ceiling the curve would otherwise give it.
 */
export function familyHintCost(countryCount: number): number {
  if (countryCount <= 0) return COST_FLOOR;
  return COST_FLOOR + COST_SPAN / (1 + countryCount / COST_PIVOT);
}

/** Subregion and continent labels that do not read as place names. */
const PLACE_LABELS: Record<string, string> = {
  "Seven seas (open ocean)": "the open ocean",
};

const COUNTRY_WORDS = Object.values(COUNTRY_NAMES).filter((n) => n.length > 3);

/** Whether a place phrase would hand over a country, which is the answer. */
function namesACountry(phrase: string): boolean {
  return COUNTRY_WORDS.some((name) => phrase.includes(name));
}

function label(place: string): string {
  return PLACE_LABELS[place] ?? place;
}

function unique(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))];
}

function listOf(values: string[]): string {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

/**
 * Where a family lives, at a granularity that never names a country.
 *
 * Two of the subregions are country lists in disguise — "Australia and New
 * Zealand", "Antarctica" — so those fall back to the continent, and when even
 * that would name one, the hint goes out with no place clause at all. The
 * family name is the part that teaches; the gloss is there for the player who
 * does not yet know the family.
 */
function placePhrase(countryCodes: string[]): string | null {
  const continents = unique(countryCodes.map((c) => REGIONS[c]?.continent));
  const subregions = unique(countryCodes.map((c) => REGIONS[c]?.subregion));

  const candidates: string[] = [];
  if (subregions.length === 1) candidates.push(label(subregions[0]));
  if (continents.length === 1) candidates.push(label(continents[0]));
  if (continents.length > 1 && continents.length <= 3) {
    // Sorted, because the set comes out in whatever order the countries were
    // listed in and the same family should read the same way twice
    candidates.push(listOf([...continents].sort().map(label)));
  }
  if (continents.length > 3) candidates.push("most of the world");

  const americas = collapseToAmericas(continents);
  if (americas) candidates.unshift(americas);

  return candidates.find((phrase) => !namesACountry(phrase)) ?? null;
}

/**
 * "the Americas" rather than "North America and South America".
 *
 * Worth the special case: it is the commonest two-continent range a bird
 * family has, the clumsiest to read as a list, and it is what an
 * ornithologist would actually say — a New World family.
 */
function collapseToAmericas(continents: string[]): string | null {
  if (continents.length !== 2) return null;
  const sorted = [...continents].sort();
  return sorted[0] === "North America" && sorted[1] === "South America"
    ? "the Americas"
    : null;
}

/**
 * "Parrotbills (Paradoxornithidae) — a family of Eastern Asia".
 *
 * Exported for its own tests; the route reaches it through getFamilyHint.
 */
export function formatFamilyHint(
  family: string,
  familySci: string | null,
  countryCodes: string[]
): string {
  const named = familySci ? `${family} (${familySci})` : family;
  const place = placePhrase(countryCodes);
  return place ? `${named} — a family of ${place}` : named;
}

/**
 * The family hint for a bird, or null when the bird has no family recorded.
 *
 * The family's range is computed live rather than materialised. Over the full
 * taxonomy — 11,167 species, 118,132 country rows — one family costs 3 ms
 * against 173 ms to aggregate every family at once, so there is no table to
 * build, no pipeline step to add, and nothing that goes stale as photography
 * fills the playable pool in.
 */
export async function getFamilyHint(
  db: D1Database,
  birdId: number
): Promise<string | null> {
  const bird = await db
    .prepare("SELECT family, family_sci FROM birds WHERE id = ?")
    .bind(birdId)
    .first<{ family: string | null; family_sci: string | null }>();

  if (!bird?.family) return null;

  return formatFamilyHint(
    bird.family,
    bird.family_sci,
    await getFamilyCountries(db, bird.family)
  );
}

/** Every country the family is recorded in, which is also what it costs. */
export async function getFamilyCountries(
  db: D1Database,
  family: string
): Promise<string[]> {
  const rows = await db
    .prepare(
      `SELECT DISTINCT bc.country_code
         FROM bird_countries bc
         JOIN birds b ON b.id = bc.bird_id
        WHERE b.family = ?`
    )
    .bind(family)
    .all<{ country_code: string }>();

  return rows.results.map((r) => r.country_code);
}

/**
 * What the family hint costs for each of several birds, in one query.
 *
 * A game needs all five prices before the player sees round one, because a
 * hint is priced before they commit to buying it.
 *
 * Every family asked for comes back with a price, including one the join
 * drops for having no country records at all. Left out of the map it would
 * be quoted the median family's price and then charged the floor, because
 * that is what the charge computes from a count of zero — a quote and a
 * charge that disagree, even in the player's favour, is a bug.
 */
export async function getFamilyHintCosts(
  db: D1Database,
  families: (string | null)[]
): Promise<Map<string, number>> {
  const wanted = [...new Set(families.filter((f): f is string => !!f))];
  if (wanted.length === 0) return new Map();

  const rows = await db
    .prepare(
      `SELECT b.family AS family, COUNT(DISTINCT bc.country_code) AS countries
         FROM birds b
         JOIN bird_countries bc ON bc.bird_id = b.id
        WHERE b.family IN (${wanted.map(() => "?").join(", ")})
        GROUP BY b.family`
    )
    .bind(...wanted)
    .all<{ family: string; countries: number }>();

  const costs = new Map(wanted.map((family) => [family, familyHintCost(0)]));
  for (const row of rows.results) {
    costs.set(row.family, familyHintCost(row.countries));
  }
  return costs;
}

/** How many countries one family occupies, for pricing a hint already taken. */
export async function getFamilyCountryCount(
  db: D1Database,
  family: string
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(DISTINCT bc.country_code) AS countries
         FROM birds b
         JOIN bird_countries bc ON bc.bird_id = b.id
        WHERE b.family = ?`
    )
    .bind(family)
    .first<{ countries: number }>();

  return row?.countries ?? 0;
}

/**
 * A hint and what it costs, which the route needs together: the family hint
 * is priced per bird, so the price cannot be read off a constant.
 */
export async function getHintWithCost(
  db: D1Database,
  birdId: number,
  level: number
): Promise<{ hint: string; penalty: number }> {
  if (level !== FAMILY_HINT_LEVEL) {
    return {
      hint: await getHintsForBird(db, birdId, level),
      penalty: HINT_PENALTIES[level - 1],
    };
  }

  const bird = await db
    .prepare("SELECT family, family_sci FROM birds WHERE id = ?")
    .bind(birdId)
    .first<{ family: string | null; family_sci: string | null }>();

  // No family recorded falls back to the subregion hint at its old flat price
  if (!bird?.family) {
    return {
      hint: await getHintsForBird(db, birdId, level),
      penalty: HINT_PENALTIES[level - 1],
    };
  }

  const countries = await getFamilyCountries(db, bird.family);
  return {
    hint: formatFamilyHint(bird.family, bird.family_sci, countries),
    penalty: familyHintCost(countries.length),
  };
}
