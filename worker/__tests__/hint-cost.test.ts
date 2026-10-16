import { describe, it, expect } from "vitest";
import {
  HINT_PENALTIES,
  hintPenaltyFromMask,
  hintCountFromMask,
  maskWithLevel,
} from "../services/game";

const L1 = 1;
const L2 = 2;

describe("HINT_PENALTIES", () => {
  it("test_hint_penalties_cover_exactly_the_two_hint_levels", () => {
    // Naming a correct country was the whole answer, so that level is gone
    expect(HINT_PENALTIES).toHaveLength(2);
  });

  it("test_hint_penalties_charge_more_for_the_narrower_hint", () => {
    expect(HINT_PENALTIES[0]).toBeLessThan(HINT_PENALTIES[1]);
  });

  it("test_hint_penalties_together_leave_some_score_to_play_for", () => {
    expect(HINT_PENALTIES[0] + HINT_PENALTIES[1]).toBeLessThan(1);
  });
});

describe("hintPenaltyFromMask", () => {
  it("test_hint_penalty_with_no_hints_taken_is_zero", () => {
    expect(hintPenaltyFromMask(0)).toBe(0);
  });

  it("test_hint_penalty_charges_only_the_levels_actually_taken", () => {
    // Taking the second hint alone must cost its own price, not two cheap ones
    expect(hintPenaltyFromMask(L2)).toBeCloseTo(HINT_PENALTIES[1]);
    expect(hintPenaltyFromMask(L1)).toBeCloseTo(HINT_PENALTIES[0]);
  });

  it("test_hint_penalty_adds_up_across_several_levels", () => {
    expect(hintPenaltyFromMask(L1 | L2)).toBeCloseTo(
      HINT_PENALTIES[0] + HINT_PENALTIES[1]
    );
  });

  it("test_hint_penalty_with_every_hint_taken_never_exceeds_the_whole_score", () => {
    expect(hintPenaltyFromMask(L1 | L2)).toBeLessThanOrEqual(1);
  });

  it("test_hint_penalty_ignores_bits_above_the_known_levels", () => {
    expect(hintPenaltyFromMask(1 << 7)).toBe(0);
  });
});

describe("hintCountFromMask", () => {
  it("test_hint_count_with_no_hints_is_zero", () => {
    expect(hintCountFromMask(0)).toBe(0);
  });

  it("test_hint_count_counts_each_level_once", () => {
    expect(hintCountFromMask(L2)).toBe(1);
    expect(hintCountFromMask(L1 | L2)).toBe(2);
  });
});

describe("maskWithLevel", () => {
  it("test_mask_with_level_records_the_level", () => {
    expect(maskWithLevel(0, 1)).toBe(L1);
    expect(maskWithLevel(0, 2)).toBe(L2);
  });

  it("test_mask_with_level_is_idempotent_so_a_repeat_reveal_is_free", () => {
    expect(maskWithLevel(L2, 2)).toBe(L2);
  });

  it("test_mask_with_level_keeps_levels_already_taken", () => {
    expect(maskWithLevel(L1, 2)).toBe(L1 | L2);
  });
});

describe("hintPenaltyFromMask with a round's own prices", () => {
  const BOTH = maskWithLevel(maskWithLevel(0, 1), 2);

  it("test_hint_penalty_charges_the_price_the_round_quoted", () => {
    // The family hint is priced per bird, so the charge cannot read a
    // constant: it must be the price the player was shown
    expect(hintPenaltyFromMask(maskWithLevel(0, 2), [0.15, 0.41])).toBeCloseTo(
      0.41,
      5
    );
  });

  it("test_hint_penalty_for_a_cosmopolitan_family_is_cheaper_than_the_default", () => {
    expect(hintPenaltyFromMask(maskWithLevel(0, 2), [0.15, 0.17])).toBeLessThan(
      hintPenaltyFromMask(maskWithLevel(0, 2))
    );
  });

  it("test_hint_penalty_with_both_hints_adds_the_round_prices", () => {
    expect(hintPenaltyFromMask(BOTH, [0.15, 0.41])).toBeCloseTo(0.56, 5);
  });

  it("test_hint_penalty_with_no_prices_given_falls_back_to_the_defaults", () => {
    expect(hintPenaltyFromMask(BOTH)).toBeCloseTo(
      HINT_PENALTIES[0] + HINT_PENALTIES[1],
      5
    );
  });

  it("test_hint_penalty_never_takes_the_whole_round", () => {
    expect(hintPenaltyFromMask(BOTH, [0.9, 0.9])).toBe(1);
  });
});
