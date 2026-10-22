import { describe, expect, it } from "vitest";
import { createOneTimePasswordPattern } from "../src/one-time-password/pattern";

describe("public OTP pattern factory", () => {
  it("[OTP-FACTORY-01] numeric, custom Unicode and repeated matches are normalized and independent", () => {
    const digits = createOneTimePasswordPattern("^[0-9]+$");
    for (const character of ["1", "١", "۱"]) expect(digits(character)).toBe(true);
    expect(digits("12")).toBe(false);
    expect(digits("")).toBe(false);
    const letters = createOneTimePasswordPattern("^[éب]+$");
    expect(letters("é")).toBe(true);
    expect(letters("ب")).toBe(true);
    expect(letters("é")).toBe(true);
    const any = createOneTimePasswordPattern("[\\s\\S]*");
    for (const character of ["\n", "\t", "\r", "\u0000", "\ud800", "\udfff", "😀"])
      expect(any(character)).toBe(false);
    expect(any("A")).toBe(true);
  });
  it("[OTP-FACTORY-02] malformed groups cannot escape the complete-character wrapper", () => {
    for (const source of ["[", "A)|(", "\\", "(?<name>"])
      expect(() => createOneTimePasswordPattern(source)).toThrow(/OneTimePasswordField.*pattern/);
    expect(createOneTimePasswordPattern("|A")("A")).toBe(true);
    expect(createOneTimePasswordPattern("|A")("B")).toBe(false);
    expect(createOneTimePasswordPattern("")("\u2028")).toBe(false);
  });
});
