import { useCallback, useState } from "react";
import { createGame } from "@/entities/game";
import type { GameRound } from "@/entities/game";

export function useStartGame() {
  const [loading, setLoading] = useState(false);

  const start = useCallback(
    async (
      mode?: "classic" | "multiple_choice"
    ): Promise<{
      gameId: string;
      mode: "classic" | "multiple_choice";
      rounds: GameRound[];
    } | null> => {
      setLoading(true);
      try {
        const data = await createGame(mode);
        return {
          gameId: data.gameId,
          mode: data.mode,
          rounds: data.rounds.map((r) => ({
            round: r.round,
            bird: r.bird,
            choices: r.choices,
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
