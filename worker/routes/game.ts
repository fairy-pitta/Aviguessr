import { Hono } from "hono";
import type { Bindings } from "../types";
import { createGame, getGameState, submitGuess } from "../services/game";

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

gameRoutes.post("/:id/guess", async (c) => {
  const gameId = c.req.param("id");
  const body = await c.req.json<{
    round: number;
    countryCode: string;
    timeMs: number;
  }>();
  const result = await submitGuess(
    c.env.DB,
    gameId,
    body.round,
    body.countryCode,
    body.timeMs
  );
  if (!result) {
    return c.json({ error: "Invalid game or round" }, 400);
  }
  return c.json(result);
});
