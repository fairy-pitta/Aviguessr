import { useEffect, useState } from "react";

/** Ease-out, so a tally sprints and then settles rather than crawling. */
export function easeOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - (1 - t) ** 3;
}

/** The figure to show part way through counting up to `total`. */
export function countAt(total: number, progress: number): number {
  return Math.round(total * easeOutCubic(progress));
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Counts up to `total` once it changes.
 *
 * Scoring a round used to be a number that was simply there, which is a poor
 * reward for the one decision the player makes all round. Counting it up
 * gives the moment somewhere to land.
 */
export function useCountUp(total: number, durationMs = 700): number {
  const [value, setValue] = useState(total);

  useEffect(() => {
    if (prefersReducedMotion() || durationMs <= 0) {
      setValue(total);
      return;
    }

    let frame = 0;
    const started = performance.now();

    const step = (now: number) => {
      const progress = (now - started) / durationMs;
      if (progress >= 1) {
        setValue(total);
        return;
      }
      setValue(countAt(total, progress));
      frame = requestAnimationFrame(step);
    };

    setValue(0);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [total, durationMs]);

  return value;
}
