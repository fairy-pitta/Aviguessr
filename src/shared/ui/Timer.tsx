import { useEffect, useState } from "react";
import { TIME_LIMIT_MS } from "../config/constants";

type TimerProps = {
  startTime: number;
  onTimeout: () => void;
  paused?: boolean;
};

export function Timer({ startTime, onTimeout, paused = false }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const ms = now - startTime;
      setElapsed(ms);
      if (ms >= TIME_LIMIT_MS) {
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

  const barColor = urgent
    ? "bg-rose-500"
    : warning
      ? "bg-amber-400"
      : "bg-teal-400";

  const glowColor = urgent
    ? "shadow-rose-500/40"
    : warning
      ? "shadow-amber-400/30"
      : "shadow-teal-400/20";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span
          className={`font-mono font-bold text-sm tracking-wider ${
            urgent
              ? "text-rose-400 animate-streak-fire"
              : warning
                ? "text-amber-300"
                : "text-slate-300"
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-100 shadow-lg ${glowColor}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
