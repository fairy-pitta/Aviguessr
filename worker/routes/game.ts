import { Hono } from "hono";
import type { Bindings } from "../types";
import {
  createGame,
  getGameState,
  submitGuess,
  maskWithLevel,
  hintCountFromMask,
  HINT_PENALTIES,
  parseGuessBody,
} from "../services/game";
import { getHintsForBird } from "../services/hints";

export const gameRoutes = new Hono<{ Bindings: Bindings }>();

gameRoutes.get("/new", async (c) => {
  const playerId = c.req.header("X-Player-Id") ?? null;
  const result = await createGame(c.env.DB, playerId);
  return c.json(result);
});

gameRoutes.get("/:id", async (c) => {
  const gameId = c.req.param("id");
  const result = await getGameState(c.env.DB, gameId);
  if (!result) {
    return c.json({ error: "Game not found" }, 404);
  }
  return c.json(result);
});

gameRoutes.get("/:id/hint", async (c) => {
  const gameId = c.req.param("id");
  const round = Number(c.req.query("round"));
  const level = Number(c.req.query("level"));

  if (!round || !level || level < 1 || level > HINT_PENALTIES.length) {
    return c.json(
      { error: `Invalid round or level (1-${HINT_PENALTIES.length})` },
      400
    );
  }

  const game = await c.env.DB
    .prepare("SELECT current_round, status FROM games WHERE id = ?")
    .bind(gameId)
    .first<{ current_round: number; status: string }>();

  if (!game || game.status !== "playing" || game.current_round !== round) {
    return c.json({ error: "Invalid game or round" }, 400);
  }

  const roundRow = await c.env.DB
    .prepare(
      "SELECT bird_id, hint_mask FROM game_rounds WHERE game_id = ? AND round = ? AND guessed_country IS NULL"
    )
    .bind(gameId, round)
    .first<{ bird_id: number; hint_mask: number | null }>();

  if (!roundRow) {
    return c.json({ error: "Round already answered" }, 400);
  }

  const hint = await getHintsForBird(c.env.DB, roundRow.bird_id, level);

  // Record that the hint was handed over, so the penalty cannot be waived by
  // simply not reporting it. The OR makes a repeat reveal free.
  const mask = maskWithLevel(roundRow.hint_mask ?? 0, level);
  await c.env.DB
    .prepare(
      "UPDATE game_rounds SET hint_mask = ?, hints_used = ? WHERE game_id = ? AND round = ?"
    )
    .bind(mask, hintCountFromMask(mask), gameId, round)
    .run();

  return c.json({ level, hint, penalty: HINT_PENALTIES[level - 1] });
});

gameRoutes.post("/:id/guess", async (c) => {
  const gameId = c.req.param("id");
  // timeMs and hintsUsed are deliberately not accepted: the server derives
  // both from game_rounds so they cannot be self-reported.
  const guess = parseGuessBody(await c.req.json().catch(() => null));
  if (!guess) {
    return c.json({ error: "round and countryCode are required" }, 400);
  }

  const result = await submitGuess(
    c.env.DB,
    gameId,
    guess.round,
    guess.countryCode
  );
  if (!result) {
    return c.json({ error: "Invalid game or round" }, 400);
  }
  return c.json(result);
});
