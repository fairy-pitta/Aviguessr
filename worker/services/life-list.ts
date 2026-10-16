/**
 * The list of birds a player has met.
 *
 * A species joins it when it is SHOWN, not when it is named. That is what a
 * life list is: the record of what you met. Whether you placed it is a
 * column on the row rather than a condition for having one — which also
 * makes the bogey list a query, `encounters > 0 AND correct = 0`, instead of
 * a second table that could drift out of step with the first.
 */

import { COUNTRY_NAMES } from "../data/countries";

/**
 * The guess worth remembering, or null.
 *
 * A round that runs out of time submits a placeholder rather than a country,
 * and the result page turns the last guess into a sentence — "you said
 * Brazil last time". There is no sentence for a placeholder, so it is not
 * recorded as one.
 */
export function recordedGuess(countryCode: string): string | null {
  return countryCode in COUNTRY_NAMES ? countryCode : null;
}

/**
 * One guess, folded into the player's row for that bird.
 *
 * Written inside the batch `submitGuess` already sends, so remembering the
 * encounter costs no extra round trip.
 */
export const LIFE_LIST_UPSERT = `
INSERT INTO life_list
  (player_id, bird_id, encounters, correct, best_score, last_guess,
   first_seen_at, last_seen_at)
VALUES (?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
ON CONFLICT(player_id, bird_id) DO UPDATE SET
  encounters   = encounters + 1,
  correct      = correct + excluded.correct,
  best_score   = MAX(best_score, excluded.best_score),
  last_guess   = excluded.last_guess,
  last_seen_at = datetime('now')`;

export function recordEncounter(
  db: D1Database,
  playerId: string,
  birdId: number,
  outcome: { isCorrect: boolean; score: number; guessedCountry: string }
): D1PreparedStatement {
  return db
    .prepare(LIFE_LIST_UPSERT)
    .bind(
      playerId,
      birdId,
      outcome.isCorrect ? 1 : 0,
      outcome.score,
      recordedGuess(outcome.guessedCountry)
    );
}

/** A row of the list as the page renders it. */
export type LifeListRow = {
  bird_id: number;
  name: string;
  family: string | null;
  encounters: number;
  correct: number;
  best_score: number;
  last_guess: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

export async function getLifeList(
  db: D1Database,
  playerId: string
): Promise<LifeListRow[]> {
  const rows = await db
    .prepare(
      `SELECT ll.bird_id, b.name, b.family, ll.encounters, ll.correct,
              ll.best_score, ll.last_guess, ll.first_seen_at, ll.last_seen_at
         FROM life_list ll
         JOIN birds b ON b.id = ll.bird_id
        WHERE ll.player_id = ?
        ORDER BY b.family, b.name`
    )
    .bind(playerId)
    .all<LifeListRow>();

  return rows.results;
}

/** The three numbers the home page and the list header both want. */
export function summarizeLifeList(rows: LifeListRow[]): {
  species: number;
  named: number;
  bogeys: number;
} {
  const named = rows.filter((r) => r.correct > 0).length;
  return { species: rows.length, named, bogeys: rows.length - named };
}

/** A bird met and never named, and how many times that has happened. */
export type BogeyCandidate = { bird_id: number; misses: number };

/**
 * The birds round four draws from: met, never named, worst first.
 *
 * Capped, because the draw that follows only needs enough candidates to stay
 * unpredictable — a player a hundred birds into a losing streak does not
 * need all hundred weighed.
 */
export async function getBogeyCandidates(
  db: D1Database,
  playerId: string,
  limit = 20
): Promise<BogeyCandidate[]> {
  const rows = await db
    .prepare(
      `SELECT ll.bird_id, ll.encounters AS misses
         FROM life_list ll
         JOIN birds b ON b.id = ll.bird_id
        WHERE ll.player_id = ? AND ll.correct = 0 AND ll.encounters > 0
          AND b.playable = 1
        ORDER BY ll.encounters DESC, ll.last_seen_at ASC
        LIMIT ?`
    )
    .bind(playerId, limit)
    .all<BogeyCandidate>();

  return rows.results;
}

/**
 * Which bogey comes back, weighted by how many times it has been missed.
 *
 * Weighted rather than sorted: taking the worst outright would show the same
 * bird every game until it was finally named, which is a punishment rather
 * than a second chance. A true nemesis still comes back sooner.
 *
 * `roll` is a number in [0, 1]; the caller supplies Math.random() so the
 * draw can be tested.
 */
export function pickReunionBird(
  candidates: BogeyCandidate[],
  roll: number
): number | null {
  if (candidates.length === 0) return null;

  // Every candidate is a bird the player met and never named, so none is
  // ineligible — a recorded miss count of zero still earns a share.
  const weights = candidates.map((c) => Math.max(1, c.misses));
  const total = weights.reduce((sum, w) => sum + w, 0);

  let target = Math.min(Math.max(roll, 0), 1) * total;
  for (let i = 0; i < candidates.length; i++) {
    target -= weights[i];
    if (target < 0) return candidates[i].bird_id;
  }
  // A roll of exactly 1 lands on the far edge of the last interval
  return candidates[candidates.length - 1].bird_id;
}
