import { useCallback, useState } from "react";
import { submitGuess } from "@/entities/game";
import type { GuessResponse } from "@/entities/game";

export function useGuess(gameId: string | null) {
  const [loading, setLoading] = useState(false);

  const guess = useCallback(
    async (
      round: number,
      countryCode: string,
      timeMs: number
    ): Promise<GuessResponse | null> => {
      if (!gameId) return null;
      setLoading(true);
      try {
        return await submitGuess(gameId, round, countryCode, timeMs);
      } finally {
        setLoading(false);
      }
    },
    [gameId]
  );

  return { guess, loading };
}
