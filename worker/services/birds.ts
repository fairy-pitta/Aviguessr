type BirdRow = {
  id: number;
  species_code: string;
  name: string;
  scientific_name: string;
  family: string | null;
  difficulty: string;
  range_size: number;
  image_key: string;
  image_license: string | null;
  image_artist: string | null;
  habitat: string | null;
  biome: string | null;
  fun_fact: string | null;
  range_description: string | null;
};

/**
 * How well known a bird is, which is what a round is drawn by.
 *
 * Difficulty used to mean range breadth, which says nothing about whether a
 * player has ever heard of the bird: a game could open on a Gray Antwren or
 * a Collared Puffbird. Research-grade iNaturalist observations are the
 * closest thing the data has to recognition — a Eurasian Magpie has 1.3
 * million of them, a White-throated Greenbul has six.
 *
 * The bounds are absolute rather than percentiles of the current pool, so
 * they keep meaning the same thing as photography fills the pool in. Across
 * the 2,498 playable species today they divide it 307 / 688 / 1,503.
 */
export type Fame = "familiar" | "known" | "obscure";

export const FAME_BANDS: Record<Fame, { min: number; max: number }> = {
  familiar: { min: 20_000, max: Number.MAX_SAFE_INTEGER },
  known: { min: 2_000, max: 20_000 },
  obscure: { min: 0, max: 2_000 },
};

/** The shape of a game: open on birds people know, end on one they do not. */
export const ROUND_FAME: Fame[] = [
  "familiar",
  "familiar",
  "known",
  "known",
  "obscure",
];

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

  return (
    "SELECT * FROM birds WHERE playable = 1" +
    " AND observations >= ? AND observations < ?" +
    `${exclusion} ORDER BY RANDOM() LIMIT 1`
  );
}

/** Ids already used in this round set, so a game never repeats a bird. */
export function distinctFrom(picked: { id: number }[]): number[] {
  return picked.map((b) => b.id);
}

/**
 * One bird per band, none repeated within the game.
 *
 * A band that comes up empty falls back to any playable bird: five rounds
 * with one missing fails the whole game, and a slightly-too-obscure round 5
 * is a far smaller cost than that.
 */
export async function getRandomBirdsByFame(
  db: D1Database,
  fames: Fame[]
): Promise<BirdRow[]> {
  const birds: BirdRow[] = [];

  for (const fame of fames) {
    const exclude = distinctFrom(birds);
    const band = FAME_BANDS[fame];
    const result =
      (await db
        .prepare(randomBirdQuery(exclude.length))
        .bind(band.min, band.max, ...exclude)
        .first<BirdRow>()) ??
      (await db
        .prepare(randomBirdQuery(exclude.length))
        .bind(0, Number.MAX_SAFE_INTEGER, ...exclude)
        .first<BirdRow>());
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
