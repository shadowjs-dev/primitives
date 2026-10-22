import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  deleteBackward,
  deleteForward,
  isAcceptedChar,
  pasteAt,
  sanitize,
  typeChar,
} from "../src/one-time-password/logic";

const SEED = { seed: 42 };

describe("one-time password editing rules", () => {
  it("[OTP-AR-01] Arabic-Indic and Persian digits normalize to Western digits", () => {
    expect(sanitize("٠١٢٣٤٥٦٧٨٩", "numeric")).toBe("0123456789");
    expect(sanitize("۰۱۲۳۴۵۶۷۸۹", "numeric")).toBe("0123456789");
    expect(isAcceptedChar("٧", "numeric")).toBe(true);
    expect(isAcceptedChar("٧\n", "numeric")).toBe(false);
    expect(isAcceptedChar("1\n", "alphanumeric")).toBe(false);
    expect(pasteAt("", 6, 0, "١2-۳٤5۶", "numeric")).toEqual({ value: "123456", focus: 5 });
  });

  it("[OTP-L01] a digit is accepted; a letter only when the code is alphanumeric", () => {
    expect(isAcceptedChar("7", "numeric")).toBe(true);
    expect(isAcceptedChar("a", "numeric")).toBe(false);
    expect(isAcceptedChar("a", "alphanumeric")).toBe(true);
    expect(isAcceptedChar("-", "alphanumeric")).toBe(false);
    expect(isAcceptedChar("", "numeric")).toBe(false);
    expect(sanitize("12-3 4a", "numeric")).toBe("1234");
    expect(sanitize("1-a2", "alphanumeric")).toBe("1a2");
  });

  it("[OTP-L02] typing appends past the end, overwrites inside, and moves focus on, stopping at the last slot", () => {
    expect(typeChar("", 6, 0, "1")).toEqual({ value: "1", focus: 1 });
    expect(typeChar("12", 6, 1, "9")).toEqual({ value: "19", focus: 2 });
    expect(typeChar("12345", 6, 5, "6")).toEqual({ value: "12345" + "6", focus: 5 });
    expect(typeChar("123456", 6, 5, "9")).toEqual({ value: "123459", focus: 5 });
  });

  it("[OTP-L03] backspace on a filled slot deletes it and keeps focus; on an empty slot it deletes the one before", () => {
    expect(deleteBackward("1234", 1)).toEqual({ value: "134", focus: 1 });
    expect(deleteBackward("1234", 4)).toEqual({ value: "123", focus: 3 });
    expect(deleteBackward("12", 5)).toEqual({ value: "1", focus: 1 });
    expect(deleteBackward("", 0)).toEqual({ value: "", focus: 0 });
  });

  it("[OTP-L04] delete removes the character in its slot and keeps focus", () => {
    expect(deleteForward("1234", 0)).toEqual({ value: "234", focus: 0 });
    expect(deleteForward("12", 2)).toEqual({ value: "12", focus: 2 });
  });

  it("[OTP-L05] a paste writes its accepted characters from the focused slot and reports the slot after them", () => {
    expect(pasteAt("", 6, 0, "12 34-56", "numeric")).toEqual({ value: "123456", focus: 5 });
    expect(pasteAt("", 6, 0, "1234567", "numeric")).toEqual({ value: "123456", focus: 5 });
    expect(pasteAt("12", 6, 2, "abc", "numeric")).toEqual({ value: "12", focus: 2 });
    expect(pasteAt("12", 6, 0, "x9", "alphanumeric")).toEqual({ value: "x9", focus: 2 });
  });

  it("[OTP-L06] property: the value never has holes, never exceeds the length, and typing keeps it contiguous", () => {
    const edit = fc.oneof(
      fc.record({ kind: fc.constant("type"), char: fc.constantFrom(..."0123456789ab-") }),
      fc.record({ kind: fc.constant("back") }),
      fc.record({ kind: fc.constant("del") }),
      fc.record({ kind: fc.constant("paste"), text: fc.string({ maxLength: 8 }) }),
    );
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.array(edit, { maxLength: 40 }),
        (length, edits) => {
          let value = "";
          let focus = 0;
          for (const step of edits) {
            const result =
              step.kind === "type"
                ? isAcceptedChar(step.char, "alphanumeric")
                  ? typeChar(value, length, focus, step.char)
                  : { value, focus }
                : step.kind === "back"
                  ? deleteBackward(value, focus)
                  : step.kind === "del"
                    ? deleteForward(value, focus)
                    : pasteAt(value, length, focus, step.text, "alphanumeric");
            value = result.value;
            focus = result.focus;
            expect(value.length).toBeLessThanOrEqual(length);
            expect(focus).toBeGreaterThanOrEqual(0);
            expect(focus).toBeLessThanOrEqual(length - 1);
            expect(value).toMatch(/^[0-9A-Za-z]*$/);
          }
        },
      ),
      SEED,
    );
  });
});
