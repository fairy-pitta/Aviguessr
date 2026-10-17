import { CENTROIDS } from "../data/centroids";
import {
  getRandomBirdsByFame,
  getBirdWithCountries,
  getBirdById,
  drawnFames,
  reunionIndex,
  withReunion,
} from "./birds";
import {
  getBogeyCandidates,
  pickReunionBird,
  recordEncounter,
} from "./life-list";
import {
  familyHintCost,
  getFamilyHintCosts,
  getFamilyCountryCount,
  FAMILY_HINT_LEVEL,
  HINT_PENALTIES,
  hintCostsForRound,
} from "./hints";

// Hint pricing lives with the hints themselves; re-exported because the
// route and the tests have always reached it through here.
export { HINT_PENALTIES, hintCostsForRound } from "./hints";
import { describeRange } from "./range";
import { questionName } from "./species-name";
import {
  rangeWeight,
  roundMaximum,
  gameMaximum,
  MAX_ROUND_SCORE,
} from "./range-weight";

export { MAX_ROUND_SCORE } from "./range-weight";

function generateId(): string {
  return crypto.randomUUID();
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateScore(distanceKm: number): number {
  return Math.round(MAX_ROUND_SCORE * Math.exp(-distanceKm / 2000));
}

/** What a guess may carry. Everything else about a round the server decides. */
export type GuessBody = { round: number; countryCode: string };

/**
 * The guess in a request body, or null when the body is not one.
 *
 * A malformed body used to reach submitGuess and fail there as a 500, which
 * tells a caller nothing about what was wrong with their request.
 */
export function parseGuessBody(raw: unknown): GuessBody | null {
  if (typeof raw !== "object" || raw === null) return null;

  const { round, countryCode } = raw as Record<string, unknown>;
  if (!Number.isInteger(round) || (round as number) < 1) return null;
  if (typeof countryCode !== "string" || countryCode.trim() === "") return null;

  return { round: round as number, countryCode };
}

const TIME_LIMIT_MS = 30000;

export function calculateTimeBonus(timeMs: number): number {
  return Math.max(0, Math.round(1000 * (1 - timeMs / TIME_LIMIT_MS)));
}

/**
 * The speed bonus actually earned, which is the full bonus scaled by how
 * close the answer was.
 *
 * It used to be paid whether or not the guess was any good: a guess 7,886 km
 * out, clicked instantly, took 97 points for the answer and 997 for the
 * speed. Deliberating for the full thirty seconds costs around 4,150 points
 * across a game, which can be more than accuracy is worth — in a game whose
 * whole point is working out where a bird lives.
 *
 * Scaling rather than withholding keeps it a slope instead of a cliff: there
 * is no moment where one kilometre of error wipes the bonus out. The scale
 * is the distance score before the hint penalty, so buying a hint is charged
 * once, where it is priced, and not again here.
 */
export function earnedTimeBonus(timeMs: number, rawScore: number): number {
  const accuracy = Math.min(1, Math.max(0, rawScore / MAX_ROUND_SCORE));
  return Math.round(calculateTimeBonus(timeMs) * accuracy);
}

/**
 * How long the player actually had the round in front of them, from the
 * server's own clock. The client used to send this, which let it claim the
 * full time bonus every round.
 *
 * A missing start time yields the full limit (no bonus) rather than zero,
 * so a row written before this was recorded cannot be turned into points.
 */
export function elapsedMs(startedAt: string | null, nowIso: string): number {
  if (!startedAt) return TIME_LIMIT_MS;

  // SQLite's datetime('now') is UTC but carries no timezone suffix
  const start = Date.parse(
    startedAt.includes("T") ? startedAt : `${startedAt.replace(" ", "T")}Z`
  );
  const now = Date.parse(nowIso);
  if (Number.isNaN(start) || Number.isNaN(now)) return TIME_LIMIT_MS;

  return Math.min(TIME_LIMIT_MS, Math.max(0, now - start));
}

/** Which hints were taken, as a bit per level (bit 0 = level 1). */
export function maskWithLevel(mask: number, level: number): number {
  return mask | (1 << (level - 1));
}

/**
 * Total penalty for the hints taken. Charging per level matters because hints
 * are opt-in: taking only the second one should cost its own price, not the
 * price of working up to it.
 */
export function hintPenaltyFromMask(
  mask: number,
  /** This round's prices; the defaults are what a median family costs. */
  costs: number[] = HINT_PENALTIES
): number {
  let penalty = 0;
  for (let i = 0; i < HINT_PENALTIES.length; i++) {
    if (mask & (1 << i)) penalty += costs[i] ?? HINT_PENALTIES[i];
  }
  return Math.min(1, penalty);
}

/** How many hints were taken, for the record kept on the round. */
export function hintCountFromMask(mask: number): number {
  let count = 0;
  for (let i = 0; i < HINT_PENALTIES.length; i++) {
    if (mask & (1 << i)) count++;
  }
  return count;
}

function getMinDistanceToCorrectCountry(
  guessedCode: string,
  correctCodes: string[]
): { distance: number; isCorrect: boolean } {
  if (correctCodes.includes(guessedCode)) {
    return { distance: 0, isCorrect: true };
  }

  const guessedCentroid = CENTROIDS[guessedCode];
  if (!guessedCentroid) {
    return { distance: 20000, isCorrect: false };
  }

  let minDistance = Infinity;
  for (const code of correctCodes) {
    const centroid = CENTROIDS[code];
    if (centroid) {
      const d = haversineDistance(
        guessedCentroid.lat,
        guessedCentroid.lng,
        centroid.lat,
        centroid.lng
      );
      minDistance = Math.min(minDistance, d);
    }
  }

  return { distance: minDistance === Infinity ? 20000 : minDistance, isCorrect: false };
}

/**
 * The five birds of a game, with round four given over to a bird the player
 * has met and never named — when they have one.
 *
 * The reunion bird is chosen first and excluded from the draw, so a game
 * never shows the same species twice. Which of the two middle rounds it
 * takes is drawn too, so its position does not announce it. With no bogeys
 * on the list both rounds fall back to the band they have always drawn
 * from, which is also what a brand-new player gets.
 */
async function composeRounds(db: D1Database, playerId: string | null) {
  const reunionId = playerId
    ? pickReunionBird(await getBogeyCandidates(db, playerId), Math.random())
    : null;
  const reunion = reunionId ? await getBirdById(db, reunionId) : null;
  const slot = reunion ? reunionIndex(Math.random()) : null;

  const drawn = await getRandomBirdsByFame(
    db,
    drawnFames(slot),
    reunion ? [reunion.id] : []
  );

  return {
    birds: withReunion(drawn, reunion, slot ?? 0),
    reunionBirdId: reunion?.id ?? null,
  };
}

export async function createGame(
  db: D1Database,
  playerId: string | null = null
) {
  const gameId = generateId();
  const { birds } = await composeRounds(db, playerId);

  if (birds.length < 5) {
    throw new Error("Not enough birds in database");
  }

  // Every price before round one is on screen: a hint is priced before the
  // player commits, and the family hint's price moves with the family
  const familyCosts = await getFamilyHintCosts(db, birds.map((b) => b.family));

  await db
    .prepare("INSERT INTO games (id, mode, player_id) VALUES (?, 'classic', ?)")
    .bind(gameId, playerId)
    .run();

  const stmts = birds.map((bird, i) =>
    db
      .prepare(
        "INSERT INTO game_rounds (game_id, round, bird_id, difficulty, started_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(
        gameId,
        i + 1,
        bird.id,
        bird.difficulty,
        // Round 1 is on screen as soon as the game is handed over
        i === 0 ? new Date().toISOString() : null
      )
  );
  await db.batch(stmts);

  return {
    gameId,
    // What a perfect game of these five is worth: a game of narrow-ranging
    // birds is worth more than one of cosmopolitan ones, so the tally cannot
    // measure against a constant
    maxScore: gameMaximum(birds.map((b) => b.range_size)),
    rounds: birds.map((bird, i) => ({
      round: i + 1,
      bird: {
        id: bird.id,
        // The name settles which of two look-alike species this is, without
        // handing over a range narrow enough for the name to be the answer
        name: questionName(bird.name, bird.range_size),
        // The family is the answer to the hint that costs the most, so it
        // cannot travel with the question
        difficulty: bird.difficulty,
        habitat: bird.habitat,
        biome: bird.biome,
        imageUrl: `/api/birds/${bird.id}/image`,
      },
      hintCosts: hintCostsForRound(
        bird.family ? familyCosts.get(bird.family) : undefined
      ),
    })),
  };
}

export async function getGameState(db: D1Database, gameId: string) {
  const game = await db
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(gameId)
    .first<{
      id: string;
      total_score: number;
      current_round: number;
      status: string;
      mode: string;
    }>();

  if (!game) return null;

  const rounds = await db
    .prepare(
      `SELECT gr.round, gr.bird_id, gr.difficulty, gr.guessed_country,
              gr.is_correct, gr.distance_km, gr.score, gr.time_ms,
              b.name, b.family, b.image_key, b.habitat, b.biome,
              b.range_description, b.range_size
       FROM game_rounds gr
       JOIN birds b ON b.id = gr.bird_id
       WHERE gr.game_id = ?
       ORDER BY gr.round`
    )
    .bind(gameId)
    .all();

  return {
    gameId: game.id,
    totalScore: game.total_score,
    currentRound: game.current_round,
    status: game.status,
    mode: game.mode ?? "classic",
    rounds: rounds.results.map((r: Record<string, unknown>) => ({
      round: r.round as number,
      bird: {
        id: r.bird_id as number,
        // An answered round has nothing left to give away
        name: r.guessed_country
          ? (r.name as string)
          : questionName(r.name as string, r.range_size as number),
        // The family is what the level-two hint sells, so it reaches the
        // client only once the round can no longer be helped by it
        family: r.guessed_country ? (r.family as string | null) : null,
        difficulty: r.difficulty as string,
        habitat: r.habitat as string | null,
        biome: r.biome as string | null,
        rangeDescription: r.range_description as string | null,
        imageUrl: `/api/birds/${r.bird_id}/image`,
      },
      result: r.guessed_country
        ? {
            guessedCountry: r.guessed_country as string,
            isCorrect: r.is_correct === 1,
            distanceKm: r.distance_km as number,
            score: r.score as number,
            timeMs: r.time_ms as number,
          }
        : null,
    })),
  };
}

export async function submitGuess(
  db: D1Database,
  gameId: string,
  round: number,
  countryCode: string
) {
  const game = await db
    .prepare("SELECT * FROM games WHERE id = ? AND status = 'playing'")
    .bind(gameId)
    .first<{
      id: string;
      current_round: number;
      total_score: number;
      mode: string;
      player_id: string | null;
    }>();

  if (!game || game.current_round !== round) return null;

  const roundRow = await db
    .prepare(
      "SELECT bird_id, started_at, hint_mask FROM game_rounds WHERE game_id = ? AND round = ? AND guessed_country IS NULL"
    )
    .bind(gameId, round)
    .first<{ bird_id: number; started_at: string | null; hint_mask: number | null }>();

  if (!roundRow) return null;

  // Both of these used to come from the request body, which let the client
  // award itself the full time bonus and waive the hint penalty.
  const timeMs = elapsedMs(roundRow.started_at, new Date().toISOString());
  const hintMask = roundRow.hint_mask ?? 0;

  const birdData = await getBirdWithCountries(db, roundRow.bird_id);
  if (!birdData) return null;

  // Read before the upsert below folds this guess in, so "you said Brazil
  // last time" means last time and not this one
  const previous = game.player_id
    ? await db
        .prepare(
          "SELECT encounters, correct, last_guess FROM life_list WHERE player_id = ? AND bird_id = ?"
        )
        .bind(game.player_id, roundRow.bird_id)
        .first<{ encounters: number; correct: number; last_guess: string | null }>()
    : null;

  const { distance, isCorrect } = getMinDistanceToCorrectCountry(
    countryCode,
    birdData.countries
  );

  // How accurate the answer was, before the bird's range is taken into
  // account. The speed bonus rides on this rather than on the weighted
  // score, so a narrow range cannot buy a bigger bonus than the clock gave.
  const accuracyScore = isCorrect ? MAX_ROUND_SCORE : calculateScore(distance);

  // What the round is worth: being right about a bird found in one country
  // says far more than being right about one found in 150.
  const weight = rangeWeight(birdData.countries.length);
  const roundMax = roundMaximum(birdData.countries.length);

  // The family hint is priced per bird, so the charge is recomputed from the
  // same family the price was quoted from rather than from a constant
  const tookFamilyHint = (hintMask & (1 << (FAMILY_HINT_LEVEL - 1))) !== 0;
  const familyCost =
    tookFamilyHint && birdData.bird.family
      ? familyHintCost(await getFamilyCountryCount(db, birdData.bird.family))
      : undefined;

  const hintPenalty = Math.max(
    0,
    1 - hintPenaltyFromMask(hintMask, hintCostsForRound(familyCost))
  );
  const rawScore = Math.round(accuracyScore * weight);
  const score = Math.min(rawScore, Math.round(roundMax * hintPenalty));
  const timeBonus = earnedTimeBonus(timeMs, accuracyScore);

  // Calculate streak from previous consecutive correct answers
  const prevRounds = await db
    .prepare(
      "SELECT is_correct FROM game_rounds WHERE game_id = ? AND round < ? ORDER BY round DESC"
    )
    .bind(gameId, round)
    .all<{ is_correct: number }>();

  let streakLength = 0;
  if (isCorrect) {
    for (const r of prevRounds.results) {
      if (r.is_correct === 1) {
        streakLength++;
      } else {
        break;
      }
    }
  }

  const streakMultiplier = Math.min(1.0 + streakLength * 0.1, 1.5);
  const baseRoundScore = score + timeBonus;
  const streakBonus = isCorrect
    ? Math.round(baseRoundScore * streakMultiplier) - baseRoundScore
    : 0;
  const totalRoundScore = baseRoundScore + streakBonus;
  const newTotalScore = game.total_score + totalRoundScore;
  const isLastRound = round >= 5;

  await db.batch([
    db
      .prepare(
        `UPDATE game_rounds
         SET guessed_country = ?, is_correct = ?, distance_km = ?, score = ?, time_ms = ?
         WHERE game_id = ? AND round = ?`
      )
      .bind(
        countryCode,
        isCorrect ? 1 : 0,
        Math.round(distance),
        totalRoundScore,
        timeMs,
        gameId,
        round
      ),
    db
      .prepare(
        `UPDATE games SET total_score = ?, current_round = ?, status = ? WHERE id = ?`
      )
      .bind(
        newTotalScore,
        isLastRound ? round : round + 1,
        isLastRound ? "finished" : "playing",
        gameId
      ),
    // The next round goes in front of the player now, so its clock starts here
    db
      .prepare(
        "UPDATE game_rounds SET started_at = datetime('now') WHERE game_id = ? AND round = ?"
      )
      .bind(gameId, round + 1),
    // The bird joins the player's life list whether or not they placed it:
    // the list records what you met, and whether you named it is a column
    ...(game.player_id
      ? [
          recordEncounter(db, game.player_id, roundRow.bird_id, {
            isCorrect,
            score: totalRoundScore,
            guessedCountry: countryCode,
          }),
        ]
      : []),
  ]);

  return {
    isCorrect,
    correctCountries: birdData.countries,
    distanceKm: Math.round(distance),
    score,
    timeBonus,
    streakLength,
    streakBonus,
    totalScore: newTotalScore,
    gameFinished: isLastRound,
    speciesName: birdData.bird.name,
    /** The family, which the question withheld because the hint sells it. */
    family: birdData.bird.family,
    /**
     * What the player's history with this bird was before this round.
     *
     * Round four is drawn from the birds they have never named, and a
     * re-encounter is only worth anything if they are told it was one — but
     * told afterwards. Knowing during the round that a bird is one you have
     * seen before narrows it to your own list, which is a substantial hint
     * handed over for free.
     */
    encounter:
      previous && previous.encounters > 0
        ? {
            count: previous.encounters,
            previousGuess: previous.last_guess,
            everNamed: previous.correct > 0,
          }
        : null,
    /** What this bird's range made the round worth, for the result page. */
    rangeWeight: weight,
    roundMax,
    rangeDescription: describeRange(birdData.countries),
    funFact: birdData.bird.fun_fact ?? null,
  };
}
