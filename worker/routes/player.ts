import { Hono } from "hono";
import type { Env } from "../types";
import { issuePlayerCookie } from "../middleware/player";
import {
  getPlayer,
  insertPlayer,
  issueRecoveryCode,
  playerForRecoveryCode,
  playerSecret,
  signPlayerId,
} from "../services/player";
import { getLifeList, summarizeLifeList } from "../services/life-list";

export const playerRoutes = new Hono<Env>();

/** Who the player is to themselves: their streak and the size of their list. */
playerRoutes.get("/", async (c) => {
  const playerId = c.get("playerId");
  const [player, list] = await Promise.all([
    getPlayer(c.env.DB, playerId),
    getLifeList(c.env.DB, playerId),
  ]);

  return c.json({
    streakDays: player?.streak_days ?? 0,
    lastDailyDate: player?.last_daily_date ?? null,
    hasRecoveryCode: Boolean(player?.recovery_hash),
    lifeList: summarizeLifeList(list),
  });
});

/**
 * Mints a code that carries this life list to another device.
 *
 * The code is returned here and nowhere else — only its hash is kept — so
 * the page that asks for one has to be the page that shows it.
 */
playerRoutes.post("/recovery-code", async (c) => {
  const playerId = c.get("playerId");
  await insertPlayer(c.env.DB, playerId);
  return c.json({ code: await issueRecoveryCode(c.env.DB, playerId) });
});

/** Hands this device the cookie for the player who owns the code. */
playerRoutes.post("/restore", async (c) => {
  const body = await c.req.json().catch(() => null);
  const code = (body as { code?: unknown } | null)?.code;
  if (typeof code !== "string") {
    return c.json({ error: "A recovery code is required" }, 400);
  }

  const owner = await playerForRecoveryCode(c.env.DB, code);
  if (!owner) {
    return c.json({ error: "That code does not match a list" }, 404);
  }

  issuePlayerCookie(
    c,
    await signPlayerId(owner, playerSecret(c.env.PLAYER_SECRET))
  );
  return c.json({ restored: true });
});
