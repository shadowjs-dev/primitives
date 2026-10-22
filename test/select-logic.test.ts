import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  getInitialSelectIndex,
  getSelectScrollDelta,
  getSelectTarget,
  SELECT_PAGE_SIZE,
} from "../src/select/logic";
import { createTypeahead } from "../src/utils/typeahead";

const SEED = { seed: 42, numRuns: 300 };

const flags = fc.array(fc.boolean(), { minLength: 0, maxLength: 40 });
const enabledIndices = (disabled: readonly boolean[]): number[] =>
  disabled.flatMap((flag, index) => (flag ? [] : [index]));

describe("getSelectTarget", () => {
  it("[SEL-L1] never returns a disabled or out-of-range index", () => {
    fc.assert(
      fc.property(
        flags,
        fc.integer({ min: -1, max: 45 }),
        fc.constantFrom("ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"),
        fc.boolean(),
        (disabled, current, key, loop) => {
          const target = getSelectTarget({ key, disabled, current, loop });
          if (target === undefined) return true;
          return (
            Number.isInteger(target) &&
            target >= 0 &&
            target < disabled.length &&
            disabled[target] === false
          );
        },
      ),
      SEED,
    );
  });

  it("[SEL-L2] Home and End find the first and last enabled item, and nothing when all are disabled", () => {
    fc.assert(
      fc.property(flags, fc.integer({ min: -1, max: 45 }), (disabled, current) => {
        const enabled = enabledIndices(disabled);
        expect(getSelectTarget({ key: "Home", disabled, current })).toBe(enabled[0]);
        expect(getSelectTarget({ key: "End", disabled, current })).toBe(enabled.at(-1));
      }),
      SEED,
    );
  });

  it("[SEL-L3] ArrowDown without loop goes to the next enabled item and stops at the end", () => {
    fc.assert(
      fc.property(flags, fc.integer({ min: 0, max: 39 }), (disabled, current) => {
        fc.pre(current < disabled.length);
        const next = enabledIndices(disabled).find((index) => index > current);
        expect(getSelectTarget({ key: "ArrowDown", disabled, current })).toBe(next);
      }),
      SEED,
    );
  });

  it("[SEL-L4] ArrowUp without loop goes to the previous enabled item and stops at the start", () => {
    fc.assert(
      fc.property(flags, fc.integer({ min: 0, max: 39 }), (disabled, current) => {
        fc.pre(current < disabled.length);
        const previous = enabledIndices(disabled)
          .filter((index) => index < current)
          .at(-1);
        expect(getSelectTarget({ key: "ArrowUp", disabled, current })).toBe(previous);
      }),
      SEED,
    );
  });

  it("[SEL-L5] with loop the arrows wrap to the nearest other enabled item", () => {
    fc.assert(
      fc.property(flags, fc.integer({ min: 0, max: 39 }), (disabled, current) => {
        fc.pre(current < disabled.length);
        const others = enabledIndices(disabled).filter((index) => index !== current);
        const down = getSelectTarget({ key: "ArrowDown", disabled, current, loop: true });
        const up = getSelectTarget({ key: "ArrowUp", disabled, current, loop: true });
        if (others.length === 0) {
          expect(down).toBeUndefined();
          expect(up).toBeUndefined();
          return;
        }
        expect(down).toBe(others.find((index) => index > current) ?? others[0]);
        expect(up).toBe(others.filter((index) => index < current).at(-1) ?? others.at(-1));
      }),
      SEED,
    );
  });

  it("[SEL-L6] from nothing highlighted ArrowDown starts at the first item and ArrowUp at the last", () => {
    fc.assert(
      fc.property(flags, (disabled) => {
        const enabled = enabledIndices(disabled);
        expect(getSelectTarget({ key: "ArrowDown", disabled, current: -1 })).toBe(enabled[0]);
        expect(getSelectTarget({ key: "ArrowUp", disabled, current: -1 })).toBe(enabled.at(-1));
      }),
      SEED,
    );
  });

  it("[SEL-L7] PageDown / PageUp move a page of enabled items and clamp at the ends", () => {
    fc.assert(
      fc.property(
        flags,
        fc.integer({ min: 0, max: 39 }),
        fc.integer({ min: 1, max: 15 }),
        (disabled, current, pageSize) => {
          fc.pre(current < disabled.length);
          const enabled = enabledIndices(disabled);
          const after = enabled.filter((index) => index > current);
          const before = enabled.filter((index) => index < current);
          const down = getSelectTarget({ key: "PageDown", disabled, current, pageSize });
          const up = getSelectTarget({ key: "PageUp", disabled, current, pageSize });
          // With no enabled item that way the key does nothing.
          expect(down).toBe(after[Math.min(pageSize, after.length) - 1]);
          expect(up).toBe(before[Math.max(before.length - pageSize, 0)]);
        },
      ),
      SEED,
    );
  });

  it("[SEL-L8] the default page is ten items", () => {
    const disabled = Array.from({ length: 30 }, () => false);
    expect(SELECT_PAGE_SIZE).toBe(10);
    expect(getSelectTarget({ key: "PageDown", disabled, current: 3 })).toBe(13);
    expect(getSelectTarget({ key: "PageUp", disabled, current: 13 })).toBe(3);
  });

  it("[SEL-L9] other keys and empty lists do nothing", () => {
    expect(getSelectTarget({ key: "ArrowLeft", disabled: [false], current: 0 })).toBeUndefined();
    expect(getSelectTarget({ key: "a", disabled: [false], current: 0 })).toBeUndefined();
    expect(getSelectTarget({ key: "ArrowDown", disabled: [], current: -1 })).toBeUndefined();
    expect(getSelectTarget({ key: "Home", disabled: [], current: -1 })).toBeUndefined();
  });
});

describe("getInitialSelectIndex", () => {
  it("[SEL-L10] prefers an enabled selected item, then the first enabled item", () => {
    fc.assert(
      fc.property(flags, fc.integer({ min: -1, max: 45 }), (disabled, selected) => {
        const result = getInitialSelectIndex(disabled, selected);
        const enabled = enabledIndices(disabled);
        if (enabled.length === 0) return result === undefined;
        if (selected >= 0 && selected < disabled.length && disabled[selected] === false) {
          return result === selected;
        }
        return result === enabled[0];
      }),
      SEED,
    );
  });
});

describe("getSelectScrollDelta", () => {
  const box = fc
    .record({
      viewTop: fc.integer({ min: -200, max: 200 }),
      viewHeight: fc.integer({ min: 1, max: 300 }),
      itemTop: fc.integer({ min: -500, max: 500 }),
      itemHeight: fc.integer({ min: 1, max: 400 }),
    })
    .map((value) => ({
      ...value,
      viewBottom: value.viewTop + value.viewHeight,
      itemBottom: value.itemTop + value.itemHeight,
    }));

  it("[SEL-L11] is zero exactly when the item is already visible", () => {
    fc.assert(
      fc.property(box, (b) => {
        const delta = getSelectScrollDelta(b.itemTop, b.itemBottom, b.viewTop, b.viewBottom);
        const visible = b.itemTop >= b.viewTop && b.itemBottom <= b.viewBottom;
        // A too-tall item whose top is already aligned has nowhere better to go.
        const aligned = b.itemHeight > b.viewHeight && b.itemTop === b.viewTop;
        return (delta === 0) === (visible || aligned);
      }),
      SEED,
    );
  });

  it("[SEL-L12] scrolling by the delta reveals the item, or aligns its top when it is too tall", () => {
    fc.assert(
      fc.property(box, (b) => {
        const delta = getSelectScrollDelta(b.itemTop, b.itemBottom, b.viewTop, b.viewBottom);
        const top = b.itemTop - delta;
        const bottom = b.itemBottom - delta;
        if (b.itemHeight <= b.viewHeight) return top >= b.viewTop && bottom <= b.viewBottom;
        return top === b.viewTop;
      }),
      SEED,
    );
  });

  it("[SEL-L13] moves the minimum distance", () => {
    expect(getSelectScrollDelta(120, 150, 0, 100)).toBe(50);
    expect(getSelectScrollDelta(-20, 10, 0, 100)).toBe(-20);
    expect(getSelectScrollDelta(10, 40, 0, 100)).toBe(0);
  });
});

describe("typeahead as the select uses it", () => {
  it("[SEL-L14] a single typed letter lands on an enabled item that starts with it, never the current one", () => {
    const words = fc.array(fc.stringMatching(/^[a-c][a-c]{0,3}$/), { minLength: 1, maxLength: 12 });
    fc.assert(
      fc.property(
        words,
        fc.array(fc.boolean(), { minLength: 12, maxLength: 12 }),
        fc.constantFrom("a", "b", "c", "A"),
        fc.integer({ min: -1, max: 11 }),
        (list, disabledFlags, letter, current) => {
          const items = list.map((value, index) => ({
            value,
            disabled: disabledFlags[index] === true,
          }));
          const typeahead = createTypeahead({ now: () => 0 });
          const index = typeahead.handleKey(letter, items, current);
          if (index === undefined) {
            return !items.some(
              (item, at) =>
                !item.disabled &&
                at !== current &&
                item.value.toLowerCase().startsWith(letter.toLowerCase()),
            );
          }
          const item = items[index];
          return (
            item !== undefined &&
            !item.disabled &&
            index !== current &&
            item.value.toLowerCase().startsWith(letter.toLowerCase())
          );
        },
      ),
      SEED,
    );
  });
});
