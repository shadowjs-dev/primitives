import { createRoot, flushSync, useEffect, useSignal } from "@shadow-js/core";
import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { otpPattern as compilePattern, filterOtp } from "../src/internal/otp-filter";
import { sanitize } from "../src/one-time-password/logic";

const otpPattern = (source: string) => {
  const expression = compilePattern(source);
  return (character: string) => expression.test(character);
};

describe("bounded OTP character filtering", () => {
  it("[OTP-FILTER-06] application predicates are untracked and caller tracking resumes afterward", () => {
    const [secret, setSecret] = useSignal(0);
    const [tracked, setTracked] = useSignal(0);
    let runs = 0;
    const dispose = createRoot((stop) => {
      useEffect(() => {
        runs += 1;
        expect(
          filterOtp(
            "1",
            "numeric",
            () => {
              secret();
              return true;
            },
            6,
          ),
        ).toBe("1");
        tracked();
      });
      return stop;
    });
    try {
      flushSync();
      expect(runs).toBe(1);
      setSecret(1);
      flushSync();
      expect(runs).toBe(1);
      setTracked(1);
      flushSync();
      expect(runs).toBe(2);
    } finally {
      dispose();
    }
  });
  it("[OTP-FILTER-05] zero-width matches cannot accept line separators and native text-input controls are refused", () => {
    expect(filterOtp("\u2028\u2029", "numeric", otpPattern(""), 6)).toBe("");
    expect(filterOtp("\n\r\u0000\tA", "numeric", otpPattern("[\\s\\S]*"), 6)).toBe("A");
  });
  it("[OTP-FILTER-01] arbitrary input follows existing digit normalization and filtering", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("a", "B", "é", "ب", "١", "۲", "-", "\ud83d", "\ude00", "\n"), {
          maxLength: 200,
        }),
        fc.integer({ min: 1, max: 64 }),
        (chars, length) => {
          const text = chars.join("");
          for (const type of ["numeric", "alphanumeric"] as const)
            expect(filterOtp(text, type, undefined, length)).toBe(
              sanitize(text, type).slice(0, length),
            );
        },
      ),
      { seed: 42, numRuns: 200 },
    );
  });
  it("[OTP-FILTER-02] every pattern match receives one unit and scanning stops at the input bound", () => {
    const expression = compilePattern("^[A-F]+$");
    const pattern = (character: string) => expression.test(character);
    if (pattern === undefined) throw new Error("missing pattern");
    const match = vi.spyOn(expression, "test");
    try {
      expect(filterOtp(`${"x".repeat(4096)}A`, "numeric", pattern, 6)).toBe("");
      expect(match).toHaveBeenCalledTimes(4096);
      expect(match.mock.calls.every(([char]) => char.length === 1)).toBe(true);
    } finally {
      match.mockRestore();
    }
  });
  it("[OTP-FILTER-03] filled output stops scanning and repetition is independent of earlier matches", () => {
    const expression = compilePattern("^(a+)+$");
    const pattern = (character: string) => expression.test(character);
    if (pattern === undefined) throw new Error("missing pattern");
    const match = vi.spyOn(expression, "test");
    try {
      expect(filterOtp(`${"a".repeat(4096)}!`, "numeric", pattern, 6)).toBe("aaaaaa");
      expect(match).toHaveBeenCalledTimes(6);
      expect(filterOtp("aaa", "numeric", pattern, 6)).toBe("aaa");
      expect(expression.global).toBe(false);
      expect(expression.sticky).toBe(false);
    } finally {
      match.mockRestore();
    }
  });
  it("[OTP-FILTER-04] empty, alternated and unanchored patterns still match complete characters", () => {
    expect(filterOtp("ABC", "numeric", otpPattern(""), 6)).toBe("");
    expect(filterOtp("ABC", "numeric", otpPattern("A|B"), 6)).toBe("AB");
    expect(filterOtp("ABA", "numeric", otpPattern("AB"), 6)).toBe("");
    expect(filterOtp("A", "numeric", otpPattern("(?=A)A"), 6)).toBe("A");
  });
});
