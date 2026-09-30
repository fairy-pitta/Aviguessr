import { Hono } from "hono";
import type { Bindings } from "../types";
import {
  createGame,
  getGameState,
  submitGuess,
  hintsUnlockedQuery,
} from "../services/game";
import type { GameMode } from "../services/game";
import { getHintsForBird } from "../services/hints";

export const gameRoutes = new Hono<{ Bindings: Bindings }>();

gameRoutes.get("/new", async (c) => {
  const mode = (c.req.query("mode") ?? "classic") as GameMode;
  const playerId = c.req.header("X-Player-Id") ?? null;
  const result = await createGame(c.env.DB, mode, playerId);
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

  // Record that the hint was handed over, so the penalty cannot be waived by
  // simply not reporting it. MAX keeps a repeat request from counting twice.
  await c.env.DB.prepare(hintsUnlockedQuery()).bind(level, gameId, round).run();

  return c.json({ level, hint });
});

gameRoutes.post("/:id/guess", async (c) => {
  const gameId = c.req.param("id");
  // timeMs and hintsUsed are deliberately not accepted: the server derives
  // both from game_rounds so they cannot be self-reported.
  const body = await c.req.json<{ round: number; countryCode: string }>();
  const result = await submitGuess(
    c.env.DB,
    gameId,
    body.round,
    body.countryCode
  );
  if (!result) {
    return c.json({ error: "Invalid game or round" }, 400);
  }
  return c.json(result);
});
