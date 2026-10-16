import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, HandRule, BookPage } from "@/shared/ui";
import { LifeList, RecoveryCode } from "@/widgets/life-list";
import { getLifeList, getPlayer } from "@/entities/player";
import type { LifeListResponse, PlayerResponse } from "@/entities/player";

/**
 * The player's own page of the guide.
 *
 * A game used to end and take everything with it. This is the thing that
 * accumulates instead: what you have met, what you have placed, and the
 * birds that keep getting away.
 */
export function ListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<LifeListResponse | null>(null);
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [listed, me] = await Promise.all([getLifeList(), getPlayer()]);
      setList(listed);
      setPlayer(me);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <BookPage>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[var(--color-ink-soft)]">
            Could not open the list.
          </p>
          <Button onClick={() => navigate("/")}>Back to the guide</Button>
        </div>
      </BookPage>
    );
  }

  if (!list || !player) {
    return (
      <BookPage>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--color-ink-soft)]">Opening your list</p>
        </div>
      </BookPage>
    );
  }

  return (
    <BookPage>
      <div className="flex-1 flex justify-center px-5 py-10 lg:py-16">
        <div className="w-full max-w-2xl">
          <header className="pb-5">
            <h1 className="text-4xl font-semibold tracking-tight leading-none">
              Your life list
            </h1>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-base text-[var(--color-ink-soft)]">
              <span>
                <span className="tabular text-[var(--color-ink)]">
                  {list.summary.species}
                </span>{" "}
                species met
              </span>
              <span>
                <span className="tabular text-[var(--color-ink)]">
                  {list.summary.named}
                </span>{" "}
                placed
              </span>
              {player.streakDays > 0 && (
                <span className="handwritten text-lg text-[var(--color-ink)]">
                  {player.streakDays === 1
                    ? "first day running"
                    : `${player.streakDays} days running`}
                </span>
              )}
            </p>
          </header>
          <HandRule />

          <LifeList entries={list.entries} summary={list.summary} />

          <RecoveryCode
            hasCode={player.hasRecoveryCode}
            onRestored={() => {
              setList(null);
              setPlayer(null);
              load();
            }}
          />

          <div className="mt-8">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back to the guide
            </Button>
          </div>
        </div>
      </div>
    </BookPage>
  );
}
