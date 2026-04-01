type BirdRow = {
  id: number;
  species_code: string;
  name: string;
  scientific_name: string;
  family: string | null;
  difficulty: string;
  image_key: string;
  image_license: string | null;
  image_artist: string | null;
  habitat: string | null;
  biome: string | null;
  fun_fact: string | null;
  range_description: string | null;
};

export async function getRandomBirdsByDifficulty(
  db: D1Database,
  difficulties: string[]
): Promise<BirdRow[]> {
  const birds: BirdRow[] = [];

  for (const difficulty of difficulties) {
    const result = await db
      .prepare(
        "SELECT * FROM birds WHERE difficulty = ? ORDER BY RANDOM() LIMIT 1"
      )
      .bind(difficulty)
      .first<BirdRow>();
    if (result) {
      birds.push(result);
    }
  }

  return birds;
}

export async function getBirdWithCountries(
  db: D1Database,
  birdId: number
): Promise<{ bird: BirdRow; countries: string[] } | null> {
  const bird = await db
    .prepare("SELECT * FROM birds WHERE id = ?")
    .bind(birdId)
    .first<BirdRow>();

  if (!bird) return null;

  const countries = await db
    .prepare("SELECT country_code FROM bird_countries WHERE bird_id = ?")
    .bind(birdId)
    .all<{ country_code: string }>();

  return {
    bird,
    countries: countries.results.map((r: { country_code: string }) => r.country_code),
  };
}
