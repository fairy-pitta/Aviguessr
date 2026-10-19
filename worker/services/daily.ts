import { getRandomBirdsByFame, ROUND_FAME } from "./birds";
import { gameMaximum } from "./range-weight";
import { questionName } from "./species-name";
import { hintCostsForRound } from "./game";
import { getFamilyHintCosts } from "./hints";
import { advanceStreak } from "./streak";
import { getPlayer, insertPlayer } from "./player";

function generateId(): string {
  return crypto.randomUUID();
}

export async function getOrCreateDailyChallenge(
  db: D1Database,
  date: string
): Promise<number[]> {
  const existing = await db
    .prepare("SELECT bird_ids FROM daily_challenges WHERE date = ?")
    .bind(date)
    .first<{ bird_ids: string }>();

  if (existing) {
    return JSON.parse(existing.bird_ids) as number[];
  }

  const birds = await getRandomBirdsByFame(db, ROUND_FAME);
  if (birds.length < 5) {
    throw new Error("Not enough birds in database for daily challenge");
  }

  const birdIds = birds.map((b) => b.id);
  await db
    .prepare(
      "INSERT INTO daily_challenges (date, bird_ids) VALUES (?, ?)"
    )
    .bind(date, JSON.stringify(birdIds))
    .run();

  return birdIds;
}

export async function createDailyGame(
  db: D1Database,
  date: string,
  playerId: string
): Promise<{
  gameId: string;
  maxScore: number;
  rounds: {
    round: number;
    bird: {
      id: number;
      name: string;
      difficulty: string;
      habitat: string | null;
      biome: string | null;
      imageUrl: string;
    };
    /** The two hint prices, level two priced by the bird's family. */
    hintCosts: number[];
  }[];
} | null> {
  // Check if player already played today
  const existing = await db
    .prepare(
      "SELECT date FROM daily_scores WHERE date = ? AND player_id = ?"
    )
    .bind(date, playerId)
    .first();

  if (existing) {
    return null;
  }

  const birdIds = await getOrCreateDailyChallenge(db, date);

  // Look up bird details
  const birds = [];
  for (const birdId of birdIds) {
    const bird = await db
      .prepare(
        "SELECT id, name, family, difficulty, habitat, biome, range_size FROM birds WHERE id = ?"
      )
      .bind(birdId)
      .first<{
        id: number;
        name: string;
        family: string | null;
        difficulty: string;
        habitat: string | null;
        biome: string | null;
        range_size: number;
      }>();
    if (bird) {
      birds.push(bird);
    }
  }

  if (birds.length < 5) {
    throw new Error("Could not load all birds for daily challenge");
  }

  const gameId = generateId();

  await db
    .prepare("INSERT INTO games (id, mode, player_id) VALUES (?, 'daily', ?)")
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
        // Round 1 is on screen as soon as the challenge is handed over
        i === 0 ? new Date().toISOString() : null
      )
  );
  await db.batch(stmts);

  const familyCosts = await getFamilyHintCosts(db, birds.map((b) => b.family));

  return {
    gameId,
    maxScore: gameMaximum(birds.map((b) => b.range_size)),
    rounds: birds.map((bird, i) => ({
      round: i + 1,
      bird: {
        id: bird.id,
        name: questionName(bird.name, bird.range_size),
        // The family is what the level-two hint sells, so the question
        // cannot carry it
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

export type DailyRoundRow = {
  round: number;
  bird_id: number;
  name: string;
  family: string | null;
  difficulty: string;
  habitat: string | null;
  biome: string | null;
  guessed_country: string | null;
  is_correct: number | null;
  distance_km: number | null;
  score: number | null;
  time_ms: number | null;
};

/** The round list the daily result screen renders, built from the server's own rows. */
export function serializeDailyRounds(rows: DailyRoundRow[]) {
  return [...rows]
    .sort((a, b) => a.round - b.round)
    .map((r) => ({
      round: r.round,
      bird: {
        id: r.bird_id,
        name: r.name,
        family: r.family,
        difficulty: r.difficulty,
        habitat: r.habitat,
        biome: r.biome,
        imageUrl: `/api/birds/${r.bird_id}/image`,
      },
      result:
        r.guessed_country === null
          ? null
          : {
              guessedCountry: r.guessed_country,
              isCorrect: r.is_correct === 1,
              distanceKm: r.distance_km ?? 0,
              score: r.score ?? 0,
              timeMs: r.time_ms ?? 0,
            },
    }));
}

/**
 * Records the player's daily result from the game the server scored.
 *
 * The client used to post totalScore and roundsJson, so a score could be put
 * on the leaderboard without playing at all. Both are now derived from the
 * player's own finished daily game.
 */
export async function submitDailyScore(
  db: D1Database,
  date: string,
  playerId: string
): Promise<{ totalScore: number; streakDays: number } | null> {
  const game = await db
    .prepare(
      `SELECT id, total_score FROM games
       WHERE player_id = ? AND mode = 'daily' AND status = 'finished'
         AND date(created_at) = ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(playerId, date)
    .first<{ id: string; total_score: number }>();

  if (!game) return null;

  const rounds = await db
    .prepare(
      `SELECT gr.round, gr.bird_id, b.name, b.family, gr.difficulty,
              b.habitat, b.biome, gr.guessed_country, gr.is_correct,
              gr.distance_km, gr.score, gr.time_ms
       FROM game_rounds gr
       JOIN birds b ON b.id = gr.bird_id
       WHERE gr.game_id = ?`
    )
    .bind(game.id)
    .all<DailyRoundRow>();

  await db
    .prepare(
      `INSERT INTO daily_scores (date, player_id, total_score, rounds_json)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date, player_id) DO NOTHING`
    )
    .bind(
      date,
      playerId,
      game.total_score,
      JSON.stringify(serializeDailyRounds(rounds.results))
    )
    .run();

  return {
    totalScore: game.total_score,
    streakDays: await recordDailyStreak(db, playerId, date),
  };
}

/**
 * Moves the player's streak on for a daily finished today.
 *
 * The rule itself is `advanceStreak`, which is a pure function of where the
 * player stood — including the case where this is a second submission for
 * the same day, which must leave the count alone rather than inflate it.
 */
export async function recordDailyStreak(
  db: D1Database,
  playerId: string,
  date: string
): Promise<number> {
  await insertPlayer(db, playerId);
  const player = await getPlayer(db, playerId);

  const next = advanceStreak(
    {
      streak: player?.streak_days ?? 0,
      lastDate: player?.last_daily_date ?? null,
      absenceMonth: player?.absence_month ?? null,
    },
    date
  );

  await db
    .prepare(
      "UPDATE players SET streak_days = ?, last_daily_date = ?, absence_month = ? WHERE id = ?"
    )
    .bind(next.streak, next.lastDate, next.absenceMonth, playerId)
    .run();

  return next.streak;
}

/**
 * Today's ten best.
 *
 * Which row is the player's own is marked here rather than compared in the
 * client, which no longer knows its own id — and the ids of everyone else
 * have no business leaving the server either.
 */
export async function getDailyLeaderboard(
  db: D1Database,
  date: string,
  viewerId: string | null = null
): Promise<{ isYou: boolean; totalScore: number; completedAt: string }[]> {
  const results = await db
    .prepare(
      "SELECT player_id, total_score, completed_at FROM daily_scores WHERE date = ? ORDER BY total_score DESC LIMIT 10"
    )
    .bind(date)
    .all<{ player_id: string; total_score: number; completed_at: string }>();

  return results.results.map((r) => ({
    isYou: viewerId !== null && r.player_id === viewerId,
    totalScore: r.total_score,
    completedAt: r.completed_at,
  }));
}

export async function getDailyStatus(
  db: D1Database,
  date: string,
  playerId: string
): Promise<{
  completed: boolean;
  totalScore: number | null;
  maxScore: number | null;
  roundsJson: string | null;
  /** Days in a row, which the result page shows whenever it is reached. */
  streakDays: number;
}> {
  const streakDays = (await getPlayer(db, playerId))?.streak_days ?? 0;

  const existing = await db
    .prepare(
      "SELECT total_score, rounds_json FROM daily_scores WHERE date = ? AND player_id = ?"
    )
    .bind(date, playerId)
    .first<{ total_score: number; rounds_json: string }>();

  if (existing) {
    return {
      completed: true,
      totalScore: existing.total_score,
      // A player coming back to the day's result still needs to know what a
      // perfect game of these five was worth; it is not a constant any more
      maxScore: await dailyMaximum(db, date),
      roundsJson: existing.rounds_json,
      streakDays,
    };
  }

  return {
    completed: false,
    totalScore: null,
    maxScore: null,
    roundsJson: null,
    streakDays,
  };
}

/** What a perfect game of the day's birds is worth. */
async function dailyMaximum(db: D1Database, date: string): Promise<number> {
  const challenge = await db
    .prepare("SELECT bird_ids FROM daily_challenges WHERE date = ?")
    .bind(date)
    .first<{ bird_ids: string }>();
  if (!challenge) return 0;

  const ids = JSON.parse(challenge.bird_ids) as number[];
  const sizes: number[] = [];
  for (const id of ids) {
    const row = await db
      .prepare("SELECT range_size FROM birds WHERE id = ?")
      .bind(id)
      .first<{ range_size: number }>();
    sizes.push(row?.range_size ?? 0);
  }

  return gameMaximum(sizes);
}
