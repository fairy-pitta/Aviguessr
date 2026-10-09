import { useCallback, useState } from "react";
import { createGame } from "@/entities/game";
import { getOrCreatePlayerId } from "@/shared/lib/playerId";
import type { GameRound } from "@/entities/game";

export function useStartGame() {
  const [loading, setLoading] = useState(false);

  const start = useCallback(
    async (): Promise<{
      gameId: string;
      rounds: GameRound[];
    } | null> => {
      setLoading(true);
      try {
        const data = await createGame(getOrCreatePlayerId());
        return {
          gameId: data.gameId,
          rounds: data.rounds.map((r) => ({
            round: r.round,
            bird: r.bird,
            result: null,
          })),
        };
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { start, loading };
}
