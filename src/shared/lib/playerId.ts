const STORAGE_KEY = "aviguessr_player_id";

/**
 * The id this browser used before the player moved into a signed cookie.
 *
 * It is handed to the server once so the games and daily scores recorded
 * against it come over, and then forgotten. Nothing mints a new one here any
 * more: the server does that, and the client never learns the result.
 */
export function legacyPlayerId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable; there is simply nothing to carry over
    return null;
  }
}

export function forgetLegacyPlayerId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the id has already served its one purpose
  }
}
