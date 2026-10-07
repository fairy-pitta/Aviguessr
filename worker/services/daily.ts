import { getRandomBirdsByDifficulty } from "./birds";

const DAILY_DIFFICULTIES = ["easy", "easy", "medium", "medium", "hard"];

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

  const birds = await getRandomBirdsByDifficulty(db, DAILY_DIFFICULTIES);
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
  rounds: {
    round: number;
    bird: {
      id: number;
      name: string;
      family: string | null;
      difficulty: string;
      habitat: string | null;
      biome: string | null;
      imageUrl: string;
    };
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
      .prepare("SELECT id, name, family, difficulty, habitat, biome FROM birds WHERE id = ?")
      .bind(birdId)
      .first<{
        id: number;
        name: string;
        family: string | null;
        difficulty: string;
        habitat: string | null;
        biome: string | null;
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

  return {
    gameId,
    rounds: birds.map((bird, i) => ({
      round: i + 1,
      bird: {
        id: bird.id,
        name: bird.name,
        family: bird.family,
        difficulty: bird.difficulty,
        habitat: bird.habitat,
        biome: bird.biome,
        imageUrl: `/api/birds/${bird.id}/image`,
      },
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
): Promise<{ totalScore: number } | null> {
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

  return { totalScore: game.total_score };
}

export async function getDailyLeaderboard(
  db: D1Database,
  date: string
): Promise<{ playerId: string; totalScore: number; completedAt: string }[]> {
  const results = await db
    .prepare(
      "SELECT player_id, total_score, completed_at FROM daily_scores WHERE date = ? ORDER BY total_score DESC LIMIT 10"
    )
    .bind(date)
    .all<{ player_id: string; total_score: number; completed_at: string }>();

  return results.results.map((r) => ({
    playerId: r.player_id,
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
  roundsJson: string | null;
}> {
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
      roundsJson: existing.rounds_json,
    };
  }

  return { completed: false, totalScore: null, roundsJson: null };
}
