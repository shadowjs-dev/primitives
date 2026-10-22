import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  choiceForKey,
  enabledItems,
  firstInvalid,
  isValid,
  neighbor,
  positionOf,
  type QuestionnaireItemStatus,
  shortcutKeys,
  statusOf,
} from "../src/questionnaire/logic";

const SEED = { seed: 42, numRuns: 200 };
const item = (name: string, options: { disabled?: boolean; required?: boolean } = {}) => ({
  name,
  disabled: options.disabled === true,
  required: options.required === true,
});

describe("questionnaire logic", () => {
  it("[QNR-L-01] shortcut keys go to enabled choices in order, a disabled choice uses none, and the keys run out at 26 letters or 9 numbers", () => {
    expect(shortcutKeys("letters", [false, true, false])).toEqual(["A", undefined, "B"]);
    expect(shortcutKeys("numbers", [false, false])).toEqual(["1", "2"]);
    expect(
      shortcutKeys(
        "numbers",
        Array.from({ length: 11 }, () => false),
      ).filter((key) => key !== undefined),
    ).toHaveLength(9);
    expect(
      shortcutKeys(
        "letters",
        Array.from({ length: 30 }, () => false),
      ).filter((key) => key !== undefined),
    ).toHaveLength(26);
    fc.assert(
      fc.property(fc.array(fc.boolean(), { maxLength: 40 }), (disabled) => {
        const keys = shortcutKeys("letters", disabled);
        expect(keys).toHaveLength(disabled.length);
        const given = keys.filter((key): key is string => key !== undefined);
        expect(new Set(given).size).toBe(given.length);
        disabled.forEach((isDisabled, index) => {
          if (isDisabled) expect(keys[index]).toBeUndefined();
        });
      }),
      SEED,
    );
  });

  it("[QNR-L-02] a typed key finds its choice whatever its case, and an unknown key finds none", () => {
    const keys = ["A", undefined, "B"];
    expect(choiceForKey(keys, "b")).toBe(2);
    expect(choiceForKey(keys, "B")).toBe(2);
    expect(choiceForKey(keys, "c")).toBe(-1);
    expect(choiceForKey(keys, "1")).toBe(-1);
  });

  it("[QNR-L-03] a status: an answer wins, a skip stays until an answer, nothing is unanswered", () => {
    expect(statusOf(true, true)).toBe("answered");
    expect(statusOf(true, false)).toBe("answered");
    expect(statusOf(false, true)).toBe("skipped");
    expect(statusOf(false, false)).toBe("unanswered");
  });

  it("[QNR-L-04] a required item is valid when answered, an optional one when answered or skipped, a disabled one always", () => {
    const required = item("a", { required: true });
    const optional = item("b");
    expect(isValid(required, "answered")).toBe(true);
    expect(isValid(required, "skipped")).toBe(false);
    expect(isValid(required, "unanswered")).toBe(false);
    expect(isValid(optional, "answered")).toBe(true);
    expect(isValid(optional, "skipped")).toBe(true);
    expect(isValid(optional, "unanswered")).toBe(false);
    expect(isValid(item("c", { disabled: true, required: true }), "unanswered")).toBe(true);
  });

  it("[QNR-L-05] navigation skips disabled items and stays at the ends", () => {
    const items = [item("a"), item("b", { disabled: true }), item("c"), item("d")];
    expect(neighbor(items, "a", 1)).toBe("c");
    expect(neighbor(items, "c", -1)).toBe("a");
    expect(neighbor(items, "a", -1)).toBe("a");
    expect(neighbor(items, "d", 1)).toBe("d");
    expect(neighbor(items, "unknown", 1)).toBe("a");
    expect(enabledItems(items).map((entry) => entry.name)).toEqual(["a", "c", "d"]);
  });

  it("[QNR-L-06] the position counts only enabled items, and the first invalid item is the first enabled one that is not valid", () => {
    const items = [
      item("a"),
      item("b", { disabled: true }),
      item("c", { required: true }),
      item("d", { required: true }),
    ];
    expect(positionOf(items, "c")).toEqual({ current: 2, total: 3, first: false, last: false });
    expect(positionOf(items, "a")).toMatchObject({ current: 1, first: true });
    expect(positionOf(items, "d")).toMatchObject({ current: 3, last: true });
    expect(positionOf([], "a")).toEqual({ current: 0, total: 0, first: true, last: true });
    const statuses = new Map<string, QuestionnaireItemStatus>([
      ["a", "skipped"],
      ["c", "answered"],
      ["d", "unanswered"],
    ]);
    expect(firstInvalid(items, statuses)).toBe("d");
    statuses.set("d", "answered");
    expect(firstInvalid(items, statuses)).toBeUndefined();
  });
});
