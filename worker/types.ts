export type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  /** Signs the player cookie. Unset in development; see `playerSecret`. */
  PLAYER_SECRET?: string;
};

export type Variables = {
  /** The player this request belongs to, established by the player middleware. */
  playerId: string;
};

export type Env = { Bindings: Bindings; Variables: Variables };
