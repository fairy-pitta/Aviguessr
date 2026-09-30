-- Migration 003: Make the server the authority on time, hints and daily score
--
-- The guess endpoint trusted client-supplied timeMs and hintsUsed, so a player
-- could claim the full 1000-point time bonus every round and skip the hint
-- penalty. The daily endpoint accepted totalScore outright, so a score could be
-- posted to the leaderboard without playing at all.
--
-- These columns give the server what it needs to compute all three itself.

-- Who a game belongs to, so a daily score can be derived from the player's own game
ALTER TABLE games ADD COLUMN player_id TEXT;

-- When each round was put in front of the player: round 1 at game creation,
-- round N+1 when round N is answered
ALTER TABLE game_rounds ADD COLUMN started_at TEXT;

-- Looking up a player's daily game for a date
CREATE INDEX IF NOT EXISTS idx_games_player_mode
  ON games(player_id, mode, created_at);
