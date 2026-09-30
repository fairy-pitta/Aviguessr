import { useEffect, useRef, useState } from "react";
import { TIME_LIMIT_MS } from "../config/constants";

type TimerProps = {
  startTime: number;
  onTimeout: () => void;
  paused?: boolean;
};

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
  const warning = fraction <= 0.5 && !urgent;

  const numberColor = urgent
    ? "text-rose-300"
    : warning
      ? "text-amber-200"
      : "text-[var(--color-text-strong)]";

  const barColor = urgent
    ? "bg-rose-400"
    : warning
      ? "bg-amber-300"
      : "bg-teal-300";

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-mono font-bold text-4xl leading-none tabular ${numberColor} ${
            urgent ? "animate-streak-fire" : ""
          }`}
          aria-live="off"
        >
          {seconds}
        </span>
        <span className="text-sm font-medium text-[var(--color-text-muted)]">
          seconds left
        </span>
      </div>
      <div className="mt-2 w-full h-2 bg-white/15 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-100`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
