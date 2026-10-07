import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/shared/api/client";

type HintResponse = {
  level: number;
  hint: string;
  penalty: number;
};

/**
 * Hints are revealed only when the player asks for one.
 *
 * They used to unlock on a timer, so the score was docked for help nobody
 * requested — and the old third level named a correct country, which is the
 * answer to the game. That level is gone; these two narrow the search.
 */
export function useHints(gameId: string | null, currentRound: number) {
  const [hints, setHints] = useState<string[]>([]);
  const [loading, setLoading] = useState<number | null>(null);
  const revealed = useRef(new Set<number>());

  useEffect(() => {
    setHints([]);
    setLoading(null);
    revealed.current = new Set();
  }, [currentRound, gameId]);

  const revealHint = useCallback(
    async (level: number): Promise<void> => {
      if (!gameId || revealed.current.has(level)) return;
      revealed.current.add(level);
      setLoading(level);
      try {
        const data = await apiFetch<HintResponse>(
          `/game/${gameId}/hint?round=${currentRound}&level=${level}`
        );
        setHints((prev) => {
          const next = [...prev];
          next[level - 1] = data.hint;
          return next;
        });
      } catch {
        // Let the player try again; nothing was charged
        revealed.current.delete(level);
      } finally {
        setLoading(null);
      }
    },
    [gameId, currentRound]
  );

  return { hints, revealHint, loading };
}
