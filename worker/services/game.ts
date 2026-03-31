import { CENTROIDS } from "../data/centroids";
import { getRandomBirdsByDifficulty, getBirdWithCountries } from "./birds";

const ROUND_DIFFICULTIES = ["easy", "easy", "medium", "medium", "hard"];

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
  return Math.round(5000 * Math.exp(-distanceKm / 2000));
}

function calculateTimeBonus(timeMs: number): number {
  return Math.max(0, Math.round(1000 * (1 - timeMs / 30000)));
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

export async function createGame(db: D1Database) {
  const gameId = generateId();
  const birds = await getRandomBirdsByDifficulty(db, ROUND_DIFFICULTIES);

  if (birds.length < 5) {
    throw new Error("Not enough birds in database");
  }

  await db
    .prepare("INSERT INTO games (id) VALUES (?)")
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
        imageUrl: `/api/birds/${bird.id}/image`,
      },
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
    }>();

  if (!game) return null;

  const rounds = await db
    .prepare(
      `SELECT gr.round, gr.bird_id, gr.difficulty, gr.guessed_country,
              gr.is_correct, gr.distance_km, gr.score, gr.time_ms,
              b.name, b.family, b.image_key
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
    rounds: rounds.results.map((r: Record<string, unknown>) => ({
      round: r.round as number,
      bird: {
        id: r.bird_id as number,
        name: r.name as string,
        family: r.family as string | null,
        difficulty: r.difficulty as string,
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
  countryCode: string,
  timeMs: number
) {
  const game = await db
    .prepare("SELECT * FROM games WHERE id = ? AND status = 'playing'")
    .bind(gameId)
    .first<{ id: string; current_round: number; total_score: number }>();

  if (!game || game.current_round !== round) return null;

  const roundRow = await db
    .prepare(
      "SELECT bird_id FROM game_rounds WHERE game_id = ? AND round = ? AND guessed_country IS NULL"
    )
    .bind(gameId, round)
    .first<{ bird_id: number }>();

  if (!roundRow) return null;

  const birdData = await getBirdWithCountries(db, roundRow.bird_id);
  if (!birdData) return null;

  const { distance, isCorrect } = getMinDistanceToCorrectCountry(
    countryCode,
    birdData.countries
  );

  const score = isCorrect ? 5000 : calculateScore(distance);
  const timeBonus = calculateTimeBonus(timeMs);
  const totalRoundScore = score + timeBonus;
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
  ]);

  return {
    isCorrect,
    correctCountries: birdData.countries,
    distanceKm: Math.round(distance),
    score,
    timeBonus,
    totalScore: newTotalScore,
    gameFinished: isLastRound,
  };
}
