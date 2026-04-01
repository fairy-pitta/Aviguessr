import { Hono } from "hono";
import type { Bindings } from "../types";
import { createGame, getGameState, submitGuess } from "../services/game";
import { getHintsForBird } from "../services/hints";

export const gameRoutes = new Hono<{ Bindings: Bindings }>();

gameRoutes.get("/new", async (c) => {
  const result = await createGame(c.env.DB);
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

  if (!round || !level || level < 1 || level > 3) {
    return c.json({ error: "Invalid round or level (1-3)" }, 400);
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
      "SELECT bird_id FROM game_rounds WHERE game_id = ? AND round = ? AND guessed_country IS NULL"
    )
    .bind(gameId, round)
    .first<{ bird_id: number }>();

  if (!roundRow) {
    return c.json({ error: "Round already answered" }, 400);
  }

  const hint = await getHintsForBird(c.env.DB, roundRow.bird_id, level);
  return c.json({ level, hint });
});

gameRoutes.post("/:id/guess", async (c) => {
  const gameId = c.req.param("id");
  const body = await c.req.json<{
    round: number;
    countryCode: string;
    timeMs: number;
    hintsUsed?: number;
  }>();
  const result = await submitGuess(
    c.env.DB,
    gameId,
    body.round,
    body.countryCode,
    body.timeMs,
    body.hintsUsed ?? 0
  );
  if (!result) {
    return c.json({ error: "Invalid game or round" }, 400);
  }
  return c.json(result);
});
