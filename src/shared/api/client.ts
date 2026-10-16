import { forgetLegacyPlayerId, legacyPlayerId } from "@/shared/lib/playerId";

const BASE = "/api";

/**
 * Hands the server the old localStorage id once, so the player it names is
 * taken over rather than replaced.
 *
 * This has to happen before anything else and exactly once. The server only
 * adopts an id nothing has claimed, so two first requests racing would see
 * the second one find the row the first had just written and mint a fresh
 * player instead — losing the list the handover existed to save. Every
 * caller waits on the same promise.
 */
let handover: Promise<void> | null = null;

function carryOverLegacyPlayer(): Promise<void> {
  if (handover) return handover;

  const legacy = legacyPlayerId();
  if (!legacy) {
    handover = Promise.resolve();
    return handover;
  }

  handover = fetch(`${BASE}/player`, {
    credentials: "same-origin",
    headers: { "X-Player-Id": legacy },
  })
    .then((res) => {
      // Only forget the id once the server has had its chance to take it on
      if (res.ok) forgetLegacyPlayerId();
    })
    .catch(() => {
      // Leave it in place; the next load will try the handover again
    });

  return handover;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  await carryOverLegacyPlayer();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    // The player is a signed cookie now, not a header the client composes
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
