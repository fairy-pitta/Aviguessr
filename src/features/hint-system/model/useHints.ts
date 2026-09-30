import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/shared/api/client";

type HintResponse = {
  level: number;
  hint: string;
};

const HINT_THRESHOLDS_MS = [5000, 15000, 25000];
/** A failing hint used to be retried twice a second for the rest of the round. */
const MAX_ATTEMPTS_PER_LEVEL = 3;

export function useHints(
  gameId: string | null,
  currentRound: number,
  roundStartTime: number
) {
  const [hints, setHints] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchedLevels = useRef(new Set<number>());
  const attempts = useRef(new Map<number, number>());

  // Reset when round changes
  useEffect(() => {
    setHints([]);
    setHintsUsed(0);
    fetchedLevels.current = new Set();
    attempts.current = new Map();
  }, [currentRound, gameId]);

  const fetchHint = useCallback(
    async (level: number) => {
      if (!gameId || fetchedLevels.current.has(level)) return;

      const tried = attempts.current.get(level) ?? 0;
      if (tried >= MAX_ATTEMPTS_PER_LEVEL) return;
      attempts.current.set(level, tried + 1);

      fetchedLevels.current.add(level);
      setLoading(true);
      try {
        const data = await apiFetch<HintResponse>(
          `/game/${gameId}/hint?round=${currentRound}&level=${level}`
        );
        setHints((prev) => {
          const next = [...prev];
          next[level - 1] = data.hint;
          return next;
        });
        setHintsUsed((prev) => Math.max(prev, level));
      } catch {
        // Allow another attempt, but only up to MAX_ATTEMPTS_PER_LEVEL
        fetchedLevels.current.delete(level);
      } finally {
        setLoading(false);
      }
    },
    [gameId, currentRound]
  );

  // Auto-fetch hints at time thresholds
  useEffect(() => {
    if (!gameId || roundStartTime === 0) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - roundStartTime;
      for (let i = 0; i < HINT_THRESHOLDS_MS.length; i++) {
        if (
          elapsed >= HINT_THRESHOLDS_MS[i] &&
          !fetchedLevels.current.has(i + 1)
        ) {
          fetchHint(i + 1);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameId, roundStartTime, fetchHint]);

  return { hints, hintsUsed, loading };
}
