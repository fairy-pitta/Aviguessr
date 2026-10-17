import { describe, it, expect } from "vitest";
import {
  ROUND_FAME,
  REUNION_SLOTS,
  reunionIndex,
  drawnFames,
  withReunion,
} from "../services/birds";

describe("REUNION_SLOTS", () => {
  it("test_reunion_slots_are_the_two_middle_rounds", () => {
    // Two familiar birds open the game and an obscure one closes it, so the
    // middle rounds are the ones that can be spent without disturbing either
    expect([...REUNION_SLOTS]).toEqual([2, 3]);
  });

  it("test_reunion_slots_all_draw_the_same_band", () => {
    // Which one is used must not change the shape of the ladder
    const bands = new Set(REUNION_SLOTS.map((i) => ROUND_FAME[i]));
    expect([...bands]).toEqual(["known"]);
  });
});

describe("reunionIndex", () => {
  it("test_reunion_index_can_fall_on_either_middle_round", () => {
    // A fixed slot would announce the re-encounter by its position alone,
    // which is the thing the round withholds until the guess is in
    expect(reunionIndex(0)).toBe(2);
    expect(reunionIndex(0.9)).toBe(3);
  });

  it("test_reunion_index_with_a_roll_of_one_stays_in_range", () => {
    expect(REUNION_SLOTS).toContain(reunionIndex(1));
  });

  it("test_reunion_index_never_leaves_the_slots", () => {
    for (let r = 0; r < 1; r += 0.01) {
      expect(REUNION_SLOTS).toContain(reunionIndex(r));
    }
  });
});

describe("drawnFames", () => {
  it("test_drawn_fames_without_a_reunion_draws_every_round", () => {
    expect(drawnFames(null)).toEqual(ROUND_FAME);
  });

  it("test_drawn_fames_with_a_reunion_leaves_that_slot_undrawn", () => {
    const fames = drawnFames(3);
    expect(fames).toHaveLength(ROUND_FAME.length - 1);
    expect(fames).toEqual(["familiar", "familiar", "known", "obscure"]);
  });

  it("test_drawn_fames_leaves_the_same_bands_whichever_slot_is_used", () => {
    expect(drawnFames(2)).toEqual(drawnFames(3));
  });
});

describe("withReunion", () => {
  it("test_with_reunion_puts_the_bird_in_the_slot_it_was_given", () => {
    expect(withReunion(["a", "b", "c", "e"], "R", 3)).toEqual([
      "a",
      "b",
      "c",
      "R",
      "e",
    ]);
    expect(withReunion(["a", "b", "c", "e"], "R", 2)).toEqual([
      "a",
      "b",
      "R",
      "c",
      "e",
    ]);
  });

  it("test_with_reunion_keeps_the_obscure_bird_last", () => {
    // The shape of a game survives the reunion: it still ends on round five
    for (const slot of REUNION_SLOTS) {
      const game = withReunion(["a", "b", "c", "e"], "R", slot);
      expect(game).toHaveLength(5);
      expect(game[4]).toBe("e");
    }
  });

  it("test_with_reunion_keeps_the_familiar_birds_first", () => {
    for (const slot of REUNION_SLOTS) {
      const game = withReunion(["a", "b", "c", "e"], "R", slot);
      expect(game.slice(0, 2)).toEqual(["a", "b"]);
    }
  });

  it("test_with_reunion_of_nothing_returns_the_drawn_birds_unchanged", () => {
    const drawn = ["a", "b", "c", "d", "e"];
    expect(withReunion(drawn, null, 3)).toEqual(drawn);
  });
});
