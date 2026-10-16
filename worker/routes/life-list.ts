import { Hono } from "hono";
import type { Env } from "../types";
import { getLifeList, summarizeLifeList } from "../services/life-list";

export const lifeListRoutes = new Hono<Env>();

/**
 * Every bird this player has met.
 *
 * The bogey list is not a second endpoint: a row with no correct answer is
 * one, and the page filters on what it already has.
 */
lifeListRoutes.get("/", async (c) => {
  const rows = await getLifeList(c.env.DB, c.get("playerId"));

  return c.json({
    summary: summarizeLifeList(rows),
    entries: rows.map((r) => ({
      birdId: r.bird_id,
      name: r.name,
      family: r.family,
      encounters: r.encounters,
      correct: r.correct,
      bestScore: r.best_score,
      lastGuess: r.last_guess,
      firstSeenAt: r.first_seen_at,
      lastSeenAt: r.last_seen_at,
      imageUrl: `/api/birds/${r.bird_id}/image`,
    })),
  });
});
