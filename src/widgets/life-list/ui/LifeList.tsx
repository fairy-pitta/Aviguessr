import { useMemo, useState } from "react";
import { HandRule } from "@/shared/ui";
import { groupByFamily } from "@/entities/player";
import type { LifeListEntry, LifeListSummary } from "@/entities/player";

type Filter = "all" | "bogeys";

type LifeListProps = {
  entries: LifeListEntry[];
  summary: LifeListSummary;
};

/**
 * Every bird the player has met, set out the way a guide sets out a list:
 * by family, ruled, no cards.
 *
 * A bird joins it when it is shown rather than when it is named, so the
 * column that matters is how often it has come up against how often it was
 * placed. The birds never placed are the ones round four draws from, which
 * is why they get a filter of their own rather than a separate page.
 */
export function LifeList({ entries, summary }: LifeListProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(() => {
    const shown =
      filter === "bogeys" ? entries.filter((e) => e.correct === 0) : entries;
    return groupByFamily(shown);
  }, [entries, filter]);

  if (entries.length === 0) {
    return (
      <p className="mt-6 text-lg text-[var(--color-ink-soft)] max-w-[44ch]">
        Nothing on the list yet. Every bird the game shows you joins it,
        whether or not you place it.
      </p>
    );
  }

  return (
    <>
      <nav className="mt-6 flex items-baseline gap-6">
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Everything"
          count={summary.species}
        />
        <FilterTab
          active={filter === "bogeys"}
          onClick={() => setFilter("bogeys")}
          label="Still unnamed"
          count={summary.bogeys}
        />
      </nav>

      <div className="mt-4">
        <HandRule />
        {groups.map((group) => (
          <section key={group.family}>
            <h2 className="pt-5 pb-1.5 text-lg font-semibold">
              {group.family}
            </h2>
            <HandRule tone="soft" />
            <ol>
              {group.entries.map((bird) => (
                <li key={bird.birdId}>
                  <Row bird={bird} />
                  <HandRule />
                </li>
              ))}
            </ol>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="py-6 text-lg text-[var(--color-ink-soft)]">
            Nothing unnamed. Every bird you have met, you have placed.
          </p>
        )}
      </div>
    </>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <span
        className={`text-base ${
          active
            ? "font-semibold text-[var(--color-ink)]"
            : "text-[var(--color-ink-soft)]"
        }`}
      >
        {label}{" "}
        <span className="tabular text-[var(--color-ink-faint)]">{count}</span>
      </span>
      <span
        aria-hidden="true"
        className={`block mt-0.5 h-[2px] ${
          active ? "bg-[var(--color-ink)]" : "bg-transparent"
        }`}
      />
    </button>
  );
}

function Row({ bird }: { bird: LifeListEntry }) {
  const named = bird.correct > 0;

  return (
    <div className="flex items-baseline gap-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium leading-snug">
          {bird.name}
        </span>
        <span className="block mt-0.5 text-base text-[var(--color-ink-soft)]">
          {/*
            How often it has come up against how often it was placed: the
            one number a list of species cannot show on its own.
          */}
          {named
            ? `Placed ${bird.correct} of ${bird.encounters}`
            : bird.encounters === 1
              ? "Missed once"
              : `Missed ${bird.encounters} times`}
        </span>
      </span>

      <span
        className="shrink-0 text-lg font-semibold tabular"
        style={{
          color: named ? "var(--color-range)" : "var(--color-miss)",
        }}
      >
        {bird.bestScore.toLocaleString()}
      </span>
    </div>
  );
}
