import { REGIONS } from "../data/regions";
import { COUNTRY_NAMES } from "../data/countries";

const NO_DATA = "No habitat data available";

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

/**
 * Builds the player-facing hint text for a bird's country list.
 * Level 1 reveals continents, level 2 subregions, level 3 one country name.
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

  if (hintLevel === 3) {
    const randomCode =
      countryCodes[Math.floor(Math.random() * countryCodes.length)];
    return `One correct country: ${countryName(randomCode)}`;
  }

  return "Invalid hint level";
}

export async function getHintsForBird(
  db: D1Database,
  birdId: number,
  hintLevel: number
): Promise<string> {
  const countries = await db
    .prepare("SELECT country_code FROM bird_countries WHERE bird_id = ?")
    .bind(birdId)
    .all<{ country_code: string }>();

  return formatHint(
    countries.results.map((r) => r.country_code),
    hintLevel
  );
}
