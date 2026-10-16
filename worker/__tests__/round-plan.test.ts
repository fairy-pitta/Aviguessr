import { describe, it, expect } from "vitest";
import {
  ROUND_FAME,
  REUNION_INDEX,
  drawnFames,
  withReunion,
} from "../services/birds";

describe("REUNION_INDEX", () => {
  it("test_reunion_index_falls_on_the_fourth_round", () => {
    // Two familiar birds open the game and an obscure one closes it; four is
    // the only slot that can be spent without disturbing either end
    expect(REUNION_INDEX).toBe(3);
    expect(ROUND_FAME[REUNION_INDEX]).toBe("known");
  });
});

describe("drawnFames", () => {
  it("test_drawn_fames_without_a_reunion_draws_every_round", () => {
    expect(drawnFames(false)).toEqual(ROUND_FAME);
  });

  it("test_drawn_fames_with_a_reunion_leaves_that_slot_undrawn", () => {
    const fames = drawnFames(true);
    expect(fames).toHaveLength(ROUND_FAME.length - 1);
    expect(fames).toEqual(["familiar", "familiar", "known", "obscure"]);
  });
});

describe("withReunion", () => {
  it("test_with_reunion_puts_the_bird_in_the_fourth_slot", () => {
    expect(withReunion(["a", "b", "c", "e"], "R")).toEqual([
      "a",
      "b",
      "c",
      "R",
      "e",
    ]);
  });

  it("test_with_reunion_keeps_the_obscure_bird_last", () => {
    // The shape of a game survives the reunion: it still ends on round five
    const game = withReunion(["a", "b", "c", "e"], "R");
    expect(game).toHaveLength(5);
    expect(game[4]).toBe("e");
  });

  it("test_with_reunion_of_nothing_returns_the_drawn_birds_unchanged", () => {
    const drawn = ["a", "b", "c", "d", "e"];
    expect(withReunion(drawn, null)).toEqual(drawn);
  });
});
