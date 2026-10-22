import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  closeItem,
  itemsToSingle,
  openItem,
  sameItems,
  setItemOpen,
  singleToItems,
} from "../src/accordion/value";

const SEED = { seed: 42 };
const item = fc.constantFrom("a", "b", "c", "d", "e");
/** A list of distinct open items, as an accordion keeps them. */
const openList = fc.uniqueArray(item, { maxLength: 5 });

describe("accordion value rules", () => {
  it("[ACC-40] single: opening an item leaves exactly that item open", () => {
    fc.assert(
      fc.property(openList, item, (open, target) => {
        expect(openItem("single", open, target)).toEqual([target]);
      }),
      SEED,
    );
  });

  it("[ACC-41] multiple: opening adds the item once and keeps the others in order", () => {
    fc.assert(
      fc.property(openList, item, (open, target) => {
        const next = openItem("multiple", open, target);
        expect(next.filter((value) => value === target)).toHaveLength(1);
        expect(next.filter((value) => value !== target)).toEqual(
          open.filter((value) => value !== target),
        );
        // Opening twice is the same as once.
        expect(openItem("multiple", next, target)).toBe(next);
      }),
      SEED,
    );
  });

  it("[ACC-42] a non-collapsible single accordion never closes its open item", () => {
    fc.assert(
      fc.property(openList, item, (open, target) => {
        const single = open.slice(0, 1);
        expect(closeItem("single", single, target, false)).toEqual(single);
      }),
      SEED,
    );
  });

  it("[ACC-43] collapsible single closes only the item that was open", () => {
    fc.assert(
      fc.property(item, item, (opened, target) => {
        const next = closeItem("single", [opened], target, true);
        expect(next).toEqual(opened === target ? [] : [opened]);
      }),
      SEED,
    );
  });

  it("[ACC-44] multiple: closing removes the item and touches nothing else", () => {
    fc.assert(
      fc.property(openList, item, (open, target) => {
        const next = closeItem("multiple", open, target, false);
        expect(next).toEqual(open.filter((value) => value !== target));
      }),
      SEED,
    );
  });

  it("[ACC-45] open then close restores a multiple accordion that did not have the item", () => {
    fc.assert(
      fc.property(openList, item, (open, target) => {
        fc.pre(!open.includes(target));
        const roundTrip = setItemOpen(
          "multiple",
          setItemOpen("multiple", open, target, true, false),
          target,
          false,
          false,
        );
        expect(roundTrip).toEqual(open);
      }),
      SEED,
    );
  });

  it("[ACC-46] a single accordion never holds more than one item", () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(item, fc.boolean(), fc.boolean()), { maxLength: 30 }),
        (steps) => {
          let open: readonly string[] = [];
          for (const [target, wantOpen, collapsible] of steps) {
            open = setItemOpen("single", open, target, wantOpen, collapsible);
            expect(open.length).toBeLessThanOrEqual(1);
          }
        },
      ),
      SEED,
    );
  });

  it("[ACC-47] unchanged state keeps the same array (no spurious change event)", () => {
    expect(openItem("single", ["a"], "a")).toEqual(["a"]);
    const same: readonly string[] = ["a", "b"];
    expect(openItem("multiple", same, "a")).toBe(same);
    expect(closeItem("multiple", same, "z", true)).toBe(same);
    expect(closeItem("single", same, "a", false)).toBe(same);
  });

  it("[ACC-48] single value conversion round-trips", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        expect(itemsToSingle(singleToItems(value) ?? ["unreachable"])).toBe(value);
      }),
      SEED,
    );
    expect(singleToItems(undefined)).toBeUndefined();
    expect(singleToItems("")).toEqual([]);
  });

  it("[ACC-49] sameItems compares values and order", () => {
    fc.assert(
      fc.property(openList, openList, (a, b) => {
        expect(sameItems(a, b)).toBe(JSON.stringify(a) === JSON.stringify(b));
      }),
      SEED,
    );
  });
});
