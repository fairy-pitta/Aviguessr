import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import type { Env } from "../types";
import {
  adoptableLegacyId,
  insertPlayer,
  playerSecret,
  signPlayerId,
  verifyPlayerCookie,
} from "../services/player";

export const PLAYER_COOKIE = "avi_pid";

/** Ten years. A life list is a long-lived thing; so is the cookie holding it. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

/**
 * Establishes which player a request belongs to, minting one if it is new.
 *
 * The id is never read or sent by the client. It used to be: the client made
 * a UUID, kept it in localStorage and put it in `X-Player-Id`, so one player
 * could send another's id and clearing site data lost the account. That
 * header is still read, but only once and only to take over an id nothing
 * has claimed, so the games and daily scores already recorded against it
 * follow the player into the cookie.
 */
export const withPlayer = createMiddleware<Env>(async (c, next) => {
  const secret = playerSecret(c.env.PLAYER_SECRET);
  const signed = await verifyPlayerCookie(getCookie(c, PLAYER_COOKIE), secret);

  if (signed) {
    c.set("playerId", signed);
    return next();
  }

  const legacy = await adoptableLegacyId(c.env.DB, c.req.header("X-Player-Id"));
  const id = legacy ?? crypto.randomUUID();
  await insertPlayer(c.env.DB, id);

  issuePlayerCookie(c, await signPlayerId(id, secret));
  c.set("playerId", id);
  return next();
});

/**
 * Writes the cookie. Shared with the recovery route, which hands a device the
 * cookie for a player it did not previously hold.
 *
 * Secure is set outside local development only: a `Secure` cookie is dropped
 * over plain http, which is what `wrangler dev` serves.
 */
export function issuePlayerCookie(
  c: Context<Env>,
  value: string
): void {
  setCookie(c, PLAYER_COOKIE, value, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: new URL(c.req.url).protocol === "https:",
  });
}
