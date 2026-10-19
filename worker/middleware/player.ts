import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import type { Env } from "../types";
import {
  insertPlayer,
  playerSecret,
  signPlayerId,
  verifyPlayerCookie,
} from "../services/player";

export const PLAYER_COOKIE = "avi_pid";

/**
 * The longest a cookie may live: browsers cap Max-Age at 400 days and reject
 * anything longer outright. It is re-issued on every request, so the expiry
 * slides forward and a player who keeps playing never reaches the limit. One
 * who stops for more than a year starts a new list — which is what the
 * recovery code is there to prevent.
 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/**
 * Establishes which player a request belongs to, minting one if it is new.
 *
 * The id is never read or sent by the client, which is the line the scoring
 * already takes: the server is the authority and the client sends as little
 * as it can.
 *
 * Mounted on the routes that need a player rather than on all of `/api/*`.
 * Minting writes a row, and in front of `/api/health` and the image route
 * that meant an uptime monitor or a hotlinked photograph wrote one on every
 * call.
 */
export const withPlayer = createMiddleware<Env>(async (c, next) => {
  const secret = requireSecret(c);
  const signed = await verifyPlayerCookie(getCookie(c, PLAYER_COOKIE), secret);

  const id = signed ?? crypto.randomUUID();
  if (!signed) await insertPlayer(c.env.DB, id);

  // Re-issued even when it already verified, so the expiry slides forward
  issuePlayerCookie(c, await signPlayerId(id, secret));
  c.set("playerId", id);
  return next();
});

/**
 * The signing secret, or a refusal.
 *
 * `wrangler dev` has to work without ceremony, so a missing secret falls back
 * to a development key — but only for a request to localhost. Deployed, that
 * key sits in a public repository, and signing with it would let anyone forge
 * a cookie for any player and open their life list. A warning in the logs is
 * not a guard, so a deployed request without a secret fails instead.
 */
export function requireSecret(c: Context<Env>): string {
  const hostname = new URL(c.req.url).hostname;
  const local = hostname === "localhost" || hostname === "127.0.0.1";

  const secret = playerSecret(c.env.PLAYER_SECRET, local);
  if (!secret) {
    throw new Error(
      "PLAYER_SECRET is not set. Run: wrangler secret put PLAYER_SECRET"
    );
  }
  return secret;
}

/**
 * Writes the cookie. Shared with the recovery route, which hands a device the
 * cookie for a player it did not previously hold.
 *
 * Secure is set outside local development only: a `Secure` cookie is dropped
 * over plain http, which is what `wrangler dev` serves.
 */
export function issuePlayerCookie(c: Context<Env>, value: string): void {
  setCookie(c, PLAYER_COOKIE, value, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: new URL(c.req.url).protocol === "https:",
  });
}
