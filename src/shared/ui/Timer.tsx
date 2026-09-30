import { useEffect, useRef, useState } from "react";
import { TIME_LIMIT_MS } from "../config/constants";

type TimerProps = {
  startTime: number;
  onTimeout: () => void;
  paused?: boolean;
};

/**
 * The countdown, set as the largest figure on the right page. A ruled bar
 * underneath carries the same information for anyone who reads shape faster
 * than digits.
 */
export function Timer({ startTime, onTimeout, paused = false }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  // The tick keeps running after the limit, so the round must only be
  // submitted once — without this it fired ten times a second.
  const firedFor = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      const ms = Date.now() - startTime;
      setElapsed(ms);
      if (ms >= TIME_LIMIT_MS && firedFor.current !== startTime) {
        firedFor.current = startTime;
        onTimeout();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, onTimeout, paused]);

  const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
  const fraction = remaining / TIME_LIMIT_MS;
  const seconds = Math.ceil(remaining / 1000);
  const urgent = fraction <= 0.2;

  return (
    <div className="shrink-0 text-right">
      <div className="flex items-baseline justify-end gap-1.5">
        <span
          className={`text-5xl font-semibold leading-none tabular ${
            urgent
              ? "text-[var(--color-alarm)] animate-alarm"
              : "text-[var(--color-ink)]"
          }`}
        >
          {seconds}
        </span>
        <span className="text-sm text-[var(--color-ink-soft)]">s</span>
      </div>
      <div
        className="mt-2 h-px w-28 ml-auto bg-[var(--color-paper-edge)]"
        aria-hidden="true"
      >
        <div
          className={`h-px transition-all duration-100 ${
            urgent ? "bg-[var(--color-alarm)]" : "bg-[var(--color-ink)]"
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
