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
    .prepare("INSERT INTO games (id, mode) VALUES (?, 'daily')")
    .bind(gameId)
    .run();

  const stmts = birds.map((bird, i) =>
    db
      .prepare(
        "INSERT INTO game_rounds (game_id, round, bird_id, difficulty) VALUES (?, ?, ?, ?)"
      )
      .bind(gameId, i + 1, bird.id, bird.difficulty)
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

export async function submitDailyScore(
  db: D1Database,
  date: string,
  playerId: string,
  totalScore: number,
  roundsJson: string
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO daily_scores (date, player_id, total_score, rounds_json) VALUES (?, ?, ?, ?)"
    )
    .bind(date, playerId, totalScore, roundsJson)
    .run();
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
