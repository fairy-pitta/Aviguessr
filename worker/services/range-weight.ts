/**
 * What a round is worth, by how narrow the bird's range is.
 *
 * "Correct" was far too coarse a thing to score. A bird recorded in 150
 * countries has about 150 right answers out of 185, so being right says
 * almost nothing; a bird found in one country has exactly one. Both paid
 * 5,000, which meant two players who both went five for five had shown
 * nothing about what they knew, and the only thing left to separate them
 * was who clicked faster.
 *
 * The curve is a smooth fall rather than bands, so no single country added
 * to a range ever costs a player a step. It never reaches the floor either:
 * the widest-ranging bird is still worth more than nothing.
 *
 * Anchored on the playable pool, whose median range is four countries — so
 * a typical round is worth what it always was.
 */
/** What a perfect answer on a median-range bird is worth, before weighting. */
export const MAX_ROUND_SCORE = 5000;

/** The most the clock can add to a round, for an instant answer. */
export const MAX_TIME_BONUS = 1000;

/** The streak multiplier for round `index`, counting from zero. */
export function streakMultiplier(index: number): number {
  return Math.min(1 + index * 0.1, 1.5);
}

const FLOOR = 0.7;
const SPAN = 0.7;
/** Where the fall is steepest, set just under the median range. */
const PIVOT = 3;

export function rangeWeight(countries: number): number {
  const n = Math.max(1, countries);
  return FLOOR + SPAN / (1 + n / PIVOT);
}

/** The most a round can score for accuracy alone, before speed and streak. */
export function roundMaximum(countries: number): number {
  return Math.round(MAX_ROUND_SCORE * rangeWeight(countries));
}

/**
 * The most a game of these birds could score: every answer exact, every one
 * instant, the streak never broken.
 *
 * The tally shows the score against this. It used to be a constant, which a
 * game of narrow-ranging birds would quietly exceed and a game of
 * cosmopolitan ones could never approach.
 */
export function gameMaximum(rangeSizes: number[]): number {
  return rangeSizes.reduce(
    (total, countries, i) =>
      total +
      Math.round(
        (roundMaximum(countries) + MAX_TIME_BONUS) * streakMultiplier(i)
      ),
    0
  );
}
