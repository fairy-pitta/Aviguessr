import { Hono } from "hono";
import type { Bindings } from "../types";
import {
  createDailyGame,
  submitDailyScore,
  getDailyLeaderboard,
  getDailyStatus,
} from "../services/daily";

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export const dailyRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/daily — Returns today's challenge, creates a game for the player
dailyRoutes.get("/", async (c) => {
  const playerId = c.req.header("X-Player-Id");
  if (!playerId) {
    return c.json({ error: "X-Player-Id header required" }, 400);
  }

  const date = getTodayUTC();
  const result = await createDailyGame(c.env.DB, date, playerId);

  if (!result) {
    return c.json({ error: "Already completed today's challenge", date }, 409);
  }

  return c.json({ date, ...result });
});

// GET /api/daily/leaderboard — Returns top scores for today
dailyRoutes.get("/leaderboard", async (c) => {
  const date = getTodayUTC();
  const leaderboard = await getDailyLeaderboard(c.env.DB, date);
  return c.json({ date, leaderboard });
});

// GET /api/daily/status — Returns whether player has completed today
dailyRoutes.get("/status", async (c) => {
  const playerId = c.req.header("X-Player-Id");
  if (!playerId) {
    return c.json({ error: "X-Player-Id header required" }, 400);
  }

  const date = getTodayUTC();
  const status = await getDailyStatus(c.env.DB, date, playerId);
  return c.json({ date, ...status });
});

// POST /api/daily/score — Submit daily score
dailyRoutes.post("/score", async (c) => {
  const playerId = c.req.header("X-Player-Id");
  if (!playerId) {
    return c.json({ error: "X-Player-Id header required" }, 400);
  }

  // No body: the score and the round list come from the game the server
  // scored, so neither can be self-reported.
  const date = getTodayUTC();
  const result = await submitDailyScore(c.env.DB, date, playerId);

  if (!result) {
    return c.json({ error: "No finished daily game for this player today" }, 400);
  }

  return c.json({ success: true, totalScore: result.totalScore });
});
