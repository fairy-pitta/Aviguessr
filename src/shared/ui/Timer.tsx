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

  const color =
    fraction > 0.5
      ? "bg-emerald-500"
      : fraction > 0.2
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-mono">{seconds}s</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-100`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
