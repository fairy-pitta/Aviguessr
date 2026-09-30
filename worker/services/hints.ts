import { REGIONS } from "../data/regions";

const NO_DATA = "No habitat data available";

/**
 * Builds the player-facing hint text for a bird's country list.
 * Level 1 reveals continents, level 2 subregions.
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
  const countries = await db
    .prepare("SELECT country_code FROM bird_countries WHERE bird_id = ?")
    .bind(birdId)
    .all<{ country_code: string }>();

  return formatHint(
    countries.results.map((r) => r.country_code),
    hintLevel
  );
}
