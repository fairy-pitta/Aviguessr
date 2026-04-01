const STORAGE_KEY = "aviguessr_player_id";

export function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
