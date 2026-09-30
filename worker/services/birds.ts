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

/**
 * Random-pick SQL for one round, excluding `excludeCount` already-picked ids.
 *
 * `playable = 1` skips the species whose image could not be verified: the
 * original Commons images were 62% maps, plates and museum skins, and a
 * species with no usable photograph is left out of rounds rather than shown
 * the wrong picture.
 */
export function randomBirdQuery(excludeCount: number): string {
  const exclusion =
    excludeCount > 0
      ? ` AND id NOT IN (${Array(excludeCount).fill("?").join(", ")})`
      : "";

  return `SELECT * FROM birds WHERE playable = 1 AND difficulty = ?${exclusion} ORDER BY RANDOM() LIMIT 1`;
}

/** Ids already used in this round set, so a game never repeats a bird. */
export function distinctFrom(picked: { id: number }[]): number[] {
  return picked.map((b) => b.id);
}

export async function getRandomBirdsByDifficulty(
  db: D1Database,
  difficulties: string[]
): Promise<BirdRow[]> {
  const birds: BirdRow[] = [];

  for (const difficulty of difficulties) {
    const exclude = distinctFrom(birds);
    const result = await db
      .prepare(randomBirdQuery(exclude.length))
      .bind(difficulty, ...exclude)
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
