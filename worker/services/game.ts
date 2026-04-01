import { CENTROIDS } from "../data/centroids";
import { REGIONS } from "../data/regions";
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

export type GameMode = "classic" | "multiple_choice";

function generateChoices(correctCodes: string[]): string[] {
  const correctCode = correctCodes[0];
  const correctRegion = REGIONS[correctCode];
  const allCodes = Object.keys(REGIONS);

  // Gather same-continent candidates (excluding correct countries)
  const sameContinentCodes = correctRegion
    ? allCodes.filter(
        (code) =>
          REGIONS[code].continent === correctRegion.continent &&
          !correctCodes.includes(code)
      )
    : [];

  // Gather other candidates
  const otherCodes = correctRegion
    ? allCodes.filter(
        (code) =>
          REGIONS[code].continent !== correctRegion.continent &&
          !correctCodes.includes(code)
      )
    : allCodes.filter((code) => !correctCodes.includes(code));

  const distractors: string[] = [];
  const used = new Set(correctCodes);

  // Prefer same continent
  const shuffledSame = sameContinentCodes.sort(() => Math.random() - 0.5);
  for (const code of shuffledSame) {
    if (distractors.length >= 3) break;
    if (!used.has(code)) {
      distractors.push(code);
      used.add(code);
    }
  }

  // Fill rest randomly from other continents
  const shuffledOther = otherCodes.sort(() => Math.random() - 0.5);
  for (const code of shuffledOther) {
    if (distractors.length >= 3) break;
    if (!used.has(code)) {
      distractors.push(code);
      used.add(code);
    }
  }

  // Shuffle correct + distractors
  const choices = [correctCode, ...distractors];
  return choices.sort(() => Math.random() - 0.5);
}

export async function createGame(
  db: D1Database,
  mode: GameMode = "classic"
) {
  const gameId = generateId();
  const birds = await getRandomBirdsByDifficulty(db, ROUND_DIFFICULTIES);

  if (birds.length < 5) {
    throw new Error("Not enough birds in database");
  }

  await db
    .prepare("INSERT INTO games (id, mode) VALUES (?, ?)")
    .bind(gameId, mode)
    .run();

  // For multiple choice, we need country data per bird to generate choices
  let roundChoices: (string[] | null)[] = birds.map(() => null);
  if (mode === "multiple_choice") {
    roundChoices = await Promise.all(
      birds.map(async (bird) => {
        const birdData = await getBirdWithCountries(db, bird.id);
        if (!birdData || birdData.countries.length === 0) return null;
        return generateChoices(birdData.countries);
      })
    );
  }

  const stmts = birds.map((bird, i) =>
    db
      .prepare(
        "INSERT INTO game_rounds (game_id, round, bird_id, difficulty, choices) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(
        gameId,
        i + 1,
        bird.id,
        bird.difficulty,
        roundChoices[i] ? JSON.stringify(roundChoices[i]) : null
      )
  );
  await db.batch(stmts);

  return {
    gameId,
    mode,
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
      ...(roundChoices[i] ? { choices: roundChoices[i] } : {}),
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
              gr.choices,
              b.name, b.family, b.image_key, b.habitat, b.biome, b.range_description
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
        name: r.name as string,
        family: r.family as string | null,
        difficulty: r.difficulty as string,
        habitat: r.habitat as string | null,
        biome: r.biome as string | null,
        rangeDescription: r.range_description as string | null,
        imageUrl: `/api/birds/${r.bird_id}/image`,
      },
      ...(r.choices
        ? { choices: JSON.parse(r.choices as string) as string[] }
        : {}),
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
  timeMs: number,
  hintsUsed: number = 0
) {
  const game = await db
    .prepare("SELECT * FROM games WHERE id = ? AND status = 'playing'")
    .bind(gameId)
    .first<{ id: string; current_round: number; total_score: number; mode: string }>();

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

  const isMultipleChoice = game.mode === "multiple_choice";
  const { distance, isCorrect } = getMinDistanceToCorrectCountry(
    countryCode,
    birdData.countries
  );

  let score: number;
  if (isMultipleChoice) {
    score = isCorrect ? 5000 : 0;
  } else {
    const hintPenalty = Math.max(0, 1 - hintsUsed * 0.15);
    const maxDistanceScore = Math.round(5000 * hintPenalty);
    const rawScore = isCorrect ? 5000 : calculateScore(distance);
    score = Math.min(rawScore, maxDistanceScore);
  }
  const timeBonus = calculateTimeBonus(timeMs);

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
         SET guessed_country = ?, is_correct = ?, distance_km = ?, score = ?, time_ms = ?, hints_used = ?
         WHERE game_id = ? AND round = ?`
      )
      .bind(
        countryCode,
        isCorrect ? 1 : 0,
        Math.round(distance),
        totalRoundScore,
        timeMs,
        hintsUsed,
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
    streakLength,
    streakBonus,
    totalScore: newTotalScore,
    gameFinished: isLastRound,
    rangeDescription: birdData.bird.range_description ?? null,
    funFact: birdData.bird.fun_fact ?? null,
  };
}
