-- Migration 004: Opt-in hints, priced per level
--
-- Hints used to unlock on a timer, and level 3 named a correct country — the
-- answer to the game itself, handed over for waiting 25 seconds. That level is
-- gone and the remaining two are revealed only when the player asks.
--
-- Pricing per level needs to know WHICH hints were taken, not just how many,
-- because a player can now take the second without the first. hint_mask holds
-- one bit per level, so recording a reveal is an idempotent OR.

ALTER TABLE game_rounds ADD COLUMN hint_mask INTEGER NOT NULL DEFAULT 0;
