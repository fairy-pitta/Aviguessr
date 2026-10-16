/**
 * Who a player is, and how that survives a cleared browser.
 *
 * The client used to make a UUID, keep it in localStorage and send it in a
 * header, which meant anyone could send anyone's id and that clearing site
 * data lost the account. Neither mattered while the only thing attached to a
 * player was one day's leaderboard row. A life list accumulates for months,
 * so it cannot live somewhere a browser will quietly empty.
 *
 * The id now lives in a signed HttpOnly cookie the client never reads, which
 * is the same line the scoring already takes: the server is the authority and
 * the client sends as little as possible.
 */

/** Crockford base32 — no I, L, O or U, so a code cannot be misread aloud. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Characters a person types for a glyph that is not in the alphabet.
 *
 * U is absent on purpose: it is excluded from the alphabet so that no code
 * spells anything, not because it looks like something else, so reading one
 * back means the code was mistyped rather than misread.
 */
const CONFUSIONS: Record<string, string> = { I: "1", L: "1", O: "0" };

/** Twelve characters of base32, about 60 bits. */
export const RECOVERY_CODE_LENGTH = 12;

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/**
 * The cookie value for a player id: the id and its signature.
 *
 * Deterministic, so handing the same player a fresh cookie — on a request
 * that refreshed its expiry, say — does not invalidate the one a second tab
 * is already holding.
 */
export async function signPlayerId(id: string, secret: string): Promise<string> {
  return `${id}.${await hmac(id, secret)}`;
}

/** The id inside a cookie this server signed, or null for anything else. */
export async function verifyPlayerCookie(
  value: string | undefined | null,
  secret: string
): Promise<string | null> {
  if (!value) return null;

  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;

  const id = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!id || !signature) return null;

  const expected = await hmac(id, secret);
  return timingSafeEqual(signature, expected) ? id : null;
}

/**
 * Constant-time for equal-length strings. The signature is derived from a
 * secret the caller does not hold, so this guards only against learning it
 * one character at a time from how long a comparison took.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

/** A code to carry a life list to another device, printed `XXXX-XXXX-XXXX`. */
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_LENGTH));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return [
    chars.slice(0, 4).join(""),
    chars.slice(4, 8).join(""),
    chars.slice(8, 12).join(""),
  ].join("-");
}

/**
 * What the player typed, as the code they were given — or null if it cannot
 * be one.
 *
 * Someone copying a code off a screen types the glyph, not the alphabet, so
 * an O becomes a zero and an I or an l becomes a one rather than a rejection.
 */
export function normalizeRecoveryCode(input: string): string | null {
  const stripped = input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .split("")
    .map((c) => CONFUSIONS[c] ?? c)
    .join("");

  if (stripped.length !== RECOVERY_CODE_LENGTH) return null;
  if (!/^[0-9A-Z]+$/.test(stripped)) return null;
  for (const c of stripped) {
    if (!ALPHABET.includes(c)) return null;
  }
  return stripped;
}

/** What is stored for a recovery code. The code itself is shown once only. */
export async function hashRecoveryCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(code));
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * The secret the cookie is signed with.
 *
 * `wrangler dev` has to work without ceremony, and this cookie authenticates
 * an anonymous player holding no personal data — the cost of a weak key in
 * development is that a developer can forge a player id on their own machine.
 * In production the secret is set and this never fires.
 */
export function playerSecret(configured: string | undefined): string {
  if (configured) return configured;
  console.warn(
    "PLAYER_SECRET is not set; signing player cookies with a development key"
  );
  return "aviguessr-development-key";
}

/** A player row, or null. Only the columns anything outside here reads. */
export type PlayerRow = {
  id: string;
  recovery_hash: string | null;
  last_daily_date: string | null;
  streak_days: number;
  absence_month: string | null;
};

export async function getPlayer(
  db: D1Database,
  id: string
): Promise<PlayerRow | null> {
  return db
    .prepare(
      "SELECT id, recovery_hash, last_daily_date, streak_days, absence_month FROM players WHERE id = ?"
    )
    .bind(id)
    .first<PlayerRow>();
}

/** Writes the row for a player that did not have one. Safe to repeat. */
export async function insertPlayer(db: D1Database, id: string): Promise<void> {
  await db
    .prepare("INSERT OR IGNORE INTO players (id) VALUES (?)")
    .bind(id)
    .run();
}

/**
 * Whether an id from the old localStorage scheme can be taken over.
 *
 * It can if nothing has claimed it, which during the migration is every
 * such id: the games and daily scores already recorded against it then come
 * with it. Once a row exists the id is spoken for and a fresh one is minted
 * instead, so the window in which a guessed id could be claimed closes as
 * rows appear — and a v4 UUID is not guessable in the first place.
 */
export async function adoptableLegacyId(
  db: D1Database,
  candidate: string | undefined | null
): Promise<string | null> {
  if (!candidate || !/^[0-9a-f-]{36}$/i.test(candidate)) return null;
  const existing = await db
    .prepare("SELECT 1 FROM players WHERE id = ?")
    .bind(candidate)
    .first();
  return existing ? null : candidate;
}

/**
 * Mints a recovery code for a player, replacing any code they already had.
 * Returns the code, which is the only time it exists in readable form.
 */
export async function issueRecoveryCode(
  db: D1Database,
  playerId: string
): Promise<string> {
  const code = generateRecoveryCode();
  await db
    .prepare("UPDATE players SET recovery_hash = ? WHERE id = ?")
    .bind(await hashRecoveryCode(normalizeRecoveryCode(code)!), playerId)
    .run();
  return code;
}

/** The player a recovery code belongs to, or null if it belongs to nobody. */
export async function playerForRecoveryCode(
  db: D1Database,
  input: string
): Promise<string | null> {
  const normalized = normalizeRecoveryCode(input);
  if (!normalized) return null;

  const row = await db
    .prepare("SELECT id FROM players WHERE recovery_hash = ?")
    .bind(await hashRecoveryCode(normalized))
    .first<{ id: string }>();

  return row?.id ?? null;
}
