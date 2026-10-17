import { describe, it, expect } from "vitest";
import {
  signPlayerId,
  verifyPlayerCookie,
  generateRecoveryCode,
  normalizeRecoveryCode,
  hashRecoveryCode,
  RECOVERY_CODE_LENGTH,
} from "../services/player";

const SECRET = "a-test-secret";
const ID = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";

describe("signPlayerId / verifyPlayerCookie", () => {
  it("test_verify_cookie_signed_with_same_secret_returns_the_id", async () => {
    const cookie = await signPlayerId(ID, SECRET);
    expect(await verifyPlayerCookie(cookie, SECRET)).toBe(ID);
  });

  it("test_verify_cookie_signed_with_other_secret_returns_null", async () => {
    const cookie = await signPlayerId(ID, "someone-elses-secret");
    expect(await verifyPlayerCookie(cookie, SECRET)).toBeNull();
  });

  it("test_verify_cookie_with_swapped_id_returns_null", async () => {
    // The signature covers the id, so keeping it and changing the id fails
    const cookie = await signPlayerId(ID, SECRET);
    const signature = cookie.split(".")[1];
    expect(
      await verifyPlayerCookie(`another-id.${signature}`, SECRET)
    ).toBeNull();
  });

  it("test_verify_cookie_with_no_signature_returns_null", async () => {
    expect(await verifyPlayerCookie(ID, SECRET)).toBeNull();
  });

  it("test_verify_cookie_with_missing_value_returns_null", async () => {
    expect(await verifyPlayerCookie(undefined, SECRET)).toBeNull();
    expect(await verifyPlayerCookie("", SECRET)).toBeNull();
  });

  it("test_sign_player_id_twice_returns_the_same_cookie", async () => {
    // Deterministic, so a reissued cookie does not invalidate an open tab
    expect(await signPlayerId(ID, SECRET)).toBe(await signPlayerId(ID, SECRET));
  });

  it("test_sign_player_id_produces_a_cookie_safe_value", async () => {
    const cookie = await signPlayerId(ID, SECRET);
    // Base64url plus the separator: nothing a Set-Cookie header must escape
    expect(cookie).toMatch(/^[A-Za-z0-9._~-]+$/);
  });
});

describe("generateRecoveryCode", () => {
  it("test_generate_recovery_code_returns_three_groups_of_four", () => {
    expect(generateRecoveryCode()).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  it("test_generate_recovery_code_omits_the_ambiguous_letters", () => {
    // Crockford base32: I, L, O and U are never printed
    const codes = Array.from({ length: 200 }, generateRecoveryCode).join("");
    expect(codes).not.toMatch(/[ILOU]/);
  });

  it("test_generate_recovery_code_twice_returns_different_codes", () => {
    expect(generateRecoveryCode()).not.toBe(generateRecoveryCode());
  });
});

describe("normalizeRecoveryCode", () => {
  it("test_normalize_recovery_code_accepts_the_printed_form", () => {
    const code = generateRecoveryCode();
    expect(normalizeRecoveryCode(code)).toBe(code.replace(/-/g, ""));
  });

  it("test_normalize_recovery_code_accepts_lowercase_and_spaces", () => {
    expect(normalizeRecoveryCode(" 4h7k 9m2n p3q4 ")).toBe("4H7K9M2NP3Q4");
  });

  it("test_normalize_recovery_code_reads_letter_o_as_zero", () => {
    // Someone copying a code off a screen types what the glyph looks like
    expect(normalizeRecoveryCode("O123456789AB")).toBe("0123456789AB");
  });

  it("test_normalize_recovery_code_reads_letters_i_and_l_as_one", () => {
    expect(normalizeRecoveryCode("I23456789ABl")).toBe("123456789AB1");
  });

  it("test_normalize_recovery_code_with_wrong_length_returns_null", () => {
    expect(normalizeRecoveryCode("4H7K9M2N")).toBeNull();
    expect(normalizeRecoveryCode(`${"A".repeat(RECOVERY_CODE_LENGTH + 1)}`)).toBeNull();
  });

  it("test_normalize_recovery_code_with_a_letter_outside_the_alphabet_returns_null", () => {
    expect(normalizeRecoveryCode("4H7K9M2NP3QU")).toBeNull();
  });
});

describe("hashRecoveryCode", () => {
  it("test_hash_recovery_code_returns_sixty_four_hex_characters", async () => {
    expect(await hashRecoveryCode("4H7K9M2NP3Q4")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("test_hash_recovery_code_is_stable_for_the_same_code", async () => {
    expect(await hashRecoveryCode("4H7K9M2NP3Q4")).toBe(
      await hashRecoveryCode("4H7K9M2NP3Q4")
    );
  });

  it("test_hash_recovery_code_differs_between_codes", async () => {
    expect(await hashRecoveryCode("4H7K9M2NP3Q4")).not.toBe(
      await hashRecoveryCode("4H7K9M2NP3Q5")
    );
  });
});
