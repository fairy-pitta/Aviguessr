export const MAX_ROUNDS = 5;
export const TIME_LIMIT_MS = 30000;
export const MAX_SCORE_PER_ROUND = 5000;

/** Maximum time bonus, awarded for an instant answer. */
export const MAX_TIME_BONUS = 1000;

/** Streak multiplier tops out here (1.0 + streak * 0.1). */
export const MAX_STREAK_MULTIPLIER = 1.5;

/**
 * Best achievable total: five correct answers, each instant, with the streak
 * multiplier climbing 1.0, 1.1, 1.2, 1.3, 1.4 across the rounds.
 * The UI previously showed 30,000, which a perfect game exceeds.
 */
export const MAX_TOTAL_SCORE = Array.from({ length: MAX_ROUNDS }, (_, i) =>
  Math.round(
    (MAX_SCORE_PER_ROUND + MAX_TIME_BONUS) *
      Math.min(1 + i * 0.1, MAX_STREAK_MULTIPLIER)
  )
).reduce((a, b) => a + b, 0);
