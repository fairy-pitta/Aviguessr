import { REGIONS } from "../data/regions";

export async function getHintsForBird(
  db: D1Database,
  birdId: number,
  hintLevel: number
): Promise<string> {
  const countries = await db
    .prepare("SELECT country_code FROM bird_countries WHERE bird_id = ?")
    .bind(birdId)
    .all<{ country_code: string }>();

  const codes = countries.results.map((r) => r.country_code);

  if (codes.length === 0) {
    return "No habitat data available";
  }

  if (hintLevel === 1) {
    const continents = [
      ...new Set(
        codes
          .map((c) => REGIONS[c]?.continent)
          .filter((v): v is string => v != null)
      ),
    ];
    return continents.length > 0
      ? `This bird lives in: ${continents.join(", ")}`
      : "Continent data unavailable";
  }

  if (hintLevel === 2) {
    const subregions = [
      ...new Set(
        codes
          .map((c) => REGIONS[c]?.subregion)
          .filter((v): v is string => v != null)
      ),
    ];
    return subregions.length > 0
      ? `Found in: ${subregions.join(", ")}`
      : "Subregion data unavailable";
  }

  if (hintLevel === 3) {
    // Return one random correct country name
    // Use the country_code and look up a display name via DB or just return the code
    const randomCode = codes[Math.floor(Math.random() * codes.length)];
    return `One correct country: ${randomCode}`;
  }

  return "Invalid hint level";
}
