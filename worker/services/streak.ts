/**
 * How many days in a row the player has done the daily challenge.
 *
 * With one forgiven day a month. A life list is a long-term object and a
 * single busy day should not be the thing that ends a hundred-day run — but
 * forgiveness that renewed any faster would make the streak mean nothing.
 *
 * The whole rule is a function of where the player stood and what today is,
 * which is what makes it testable and what keeps a repeated submission from
 * inflating anything.
 */

export type StreakState = {
  streak: number;
  /** UTC date of the last daily completed, 'YYYY-MM-DD'. */
  lastDate: string | null;
  /** 'YYYY-MM' of the month whose single absence has been spent. */
  absenceMonth: string | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days from one UTC date to another; negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY);
}

function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** The UTC date one day on, which for a gap of two is the day missed. */
function dayAfter(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

/** Where the streak stands after a daily completed on `today`. */
export function advanceStreak(state: StreakState, today: string): StreakState {
  if (state.lastDate === today) return state;

  const gap =
    state.lastDate === null ? Infinity : daysBetween(state.lastDate, today);

  if (gap === 1) {
    return { streak: state.streak + 1, lastDate: today, absenceMonth: state.absenceMonth };
  }

  // Exactly one day missed, and the absence for the month that day fell in
  // is still unspent. It is charged to that month rather than to today's: a
  // Hallowe'en missed between two days of play is October's absence, and
  // spending November's on it would take a day the player never used.
  if (gap === 2) {
    const missed = monthOf(dayAfter(state.lastDate!));
    if (state.absenceMonth !== missed) {
      return {
        streak: state.streak + 1,
        lastDate: today,
        absenceMonth: missed,
      };
    }
  }

  return { streak: 1, lastDate: today, absenceMonth: state.absenceMonth };
}
