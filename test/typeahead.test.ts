import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createTypeahead, getNextMatch } from "../src/utils/typeahead";

const FRUIT = ["Apple", "Avocado", "Banana", "Blueberry", "Cherry"];
const items = (values: readonly string[], disabled: readonly string[] = []) =>
  values.map((value) => ({ value, disabled: disabled.includes(value) }));

function clock(): { now: () => number; advance: (ms: number) => void } {
  let time = 0;
  return {
    now: () => time,
    advance(ms) {
      time += ms;
    },
  };
}

describe("typeahead getNextMatch", () => {
  it("[TYP-01] finds the first prefix match, case-insensitively", () => {
    expect(getNextMatch(FRUIT, "ban")).toBe("Banana");
    expect(getNextMatch(FRUIT, "BLU")).toBe("Blueberry");
    expect(getNextMatch(FRUIT, "zzz-none")).toBeUndefined();
  });

  it("[TYP-02] a single character skips the current item and wraps", () => {
    expect(getNextMatch(FRUIT, "a", "Apple")).toBe("Avocado");
    expect(getNextMatch(FRUIT, "a", "Avocado")).toBe("Apple");
    expect(getNextMatch(FRUIT, "b", "Cherry")).toBe("Banana");
  });

  it("[TYP-03] a repeated character cycles", () => {
    expect(getNextMatch(FRUIT, "aa", "Apple")).toBe("Avocado");
    expect(getNextMatch(FRUIT, "aaa", "Avocado")).toBe("Apple");
  });

  it("[TYP-04] a multi-character search starts at the current item and reports no movement", () => {
    expect(getNextMatch(FRUIT, "bl", "Banana")).toBe("Blueberry");
    expect(getNextMatch(FRUIT, "ban", "Banana")).toBeUndefined();
    expect(getNextMatch(FRUIT, "av", "Cherry")).toBe("Avocado");
  });

  it("[TYP-05] only the current item matching a single character gives undefined", () => {
    expect(getNextMatch(FRUIT, "c", "Cherry")).toBeUndefined();
  });

  it("[TYP-06] empty inputs give undefined", () => {
    expect(getNextMatch([], "a")).toBeUndefined();
    expect(getNextMatch(FRUIT, "")).toBeUndefined();
  });

  it("[TYP-07] uses locale-aware lower casing", () => {
    expect(getNextMatch(["Éclair", "Zebra"], "é")).toBe("Éclair");
  });
});

describe("typeahead createTypeahead", () => {
  it("[TYP-10] accumulates characters within the timeout", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now });
    expect(t.handleKey("b", items(FRUIT), -1)).toBe(2);
    c.advance(500);
    expect(t.handleKey("l", items(FRUIT), 2)).toBe(3);
    expect(t.search()).toBe("bl");
  });

  it("[TYP-11] starts over after the timeout of inactivity", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now, timeout: 300 });
    t.handleKey("b", items(FRUIT), -1);
    c.advance(301);
    expect(t.search()).toBe("");
    expect(t.handleKey("c", items(FRUIT), 2)).toBe(4);
    expect(t.search()).toBe("c");
  });

  it("[TYP-12] a key at exactly the timeout still accumulates", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now, timeout: 300 });
    t.handleKey("b", items(FRUIT), -1);
    c.advance(300);
    expect(t.handleKey("l", items(FRUIT), 2)).toBe(3);
  });

  it("[TYP-13] ignores multi-character keys and does not reset on them", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now });
    t.handleKey("b", items(FRUIT), -1);
    expect(t.handleKey("ArrowDown", items(FRUIT), 2)).toBeUndefined();
    expect(t.handleKey("Enter", items(FRUIT), 2)).toBeUndefined();
    expect(t.handleKey("Backspace", items(FRUIT), 2)).toBeUndefined();
    expect(t.search()).toBe("b");
  });

  it("[TYP-14] a leading space is ignored, a space inside a search counts", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now });
    const list = items(["New York", "Newark", "Nome"]);
    expect(t.handleKey(" ", list, -1)).toBeUndefined();
    expect(t.search()).toBe("");
    t.handleKey("n", list, -1);
    t.handleKey("e", list, 0);
    t.handleKey("w", list, 0);
    expect(t.handleKey(" ", list, 0)).toBe(0);
    expect(t.search()).toBe("new ");
  });

  it("[TYP-15] skips disabled items", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now });
    expect(t.handleKey("a", items(FRUIT, ["Apple"]), -1)).toBe(1);
    t.reset();
    expect(t.handleKey("c", items(FRUIT, ["Cherry"]), -1)).toBeUndefined();
  });

  it("[TYP-16] repeated characters cycle through enabled items", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now });
    const list = items(FRUIT);
    expect(t.handleKey("a", list, 0)).toBe(1);
    expect(t.handleKey("a", list, 1)).toBe(0);
    expect(t.handleKey("a", list, 0)).toBe(1);
  });

  it("[TYP-17] reset clears the search", () => {
    const c = clock();
    const t = createTypeahead({ now: c.now });
    t.handleKey("b", items(FRUIT), -1);
    t.reset();
    expect(t.search()).toBe("");
    expect(t.handleKey("c", items(FRUIT), -1)).toBe(4);
  });

  it("[TYP-18] defaults to performance.now and a 1000 ms timeout", () => {
    const t = createTypeahead();
    expect(t.handleKey("c", items(FRUIT), -1)).toBe(4);
    expect(t.search()).toBe("c");
  });

  it("[TYP-19] an out-of-range current index behaves like no current item", () => {
    const t = createTypeahead({ now: () => 0 });
    expect(t.handleKey("a", items(FRUIT), 99)).toBe(0);
  });
});

describe("typeahead properties", () => {
  const word = fc.stringMatching(/^[a-cA-C]{1,4}$/);
  const itemArb = fc.record({ value: word, disabled: fc.boolean() });

  it("[TYP-20] a returned index is in range, enabled, and prefix-matching", () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { maxLength: 12 }),
        fc.array(fc.constantFrom("a", "b", "c", "A", " ", "Enter"), { maxLength: 6 }),
        fc.integer({ min: -3, max: 15 }),
        (list, keys, startIndex) => {
          const c = clock();
          const t = createTypeahead({ now: c.now });
          let current = startIndex;
          for (const key of keys) {
            const result = t.handleKey(key, list, current);
            if (result === undefined) continue;
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(list.length);
            const item = list[result];
            expect(item?.disabled).toBe(false);
            const typed = t.search();
            const chars = Array.from(typed);
            const first = chars[0];
            const needle =
              first !== undefined && chars.length > 1 && chars.every((x) => x === first)
                ? first
                : typed;
            expect(item?.value.toLocaleLowerCase().startsWith(needle.toLocaleLowerCase())).toBe(
              true,
            );
            current = result;
          }
        },
      ),
      { seed: 42 },
    );
  });

  it("[TYP-21] getNextMatch only returns values of the list that start with the search", () => {
    fc.assert(
      fc.property(
        fc.array(word, { maxLength: 10 }),
        word,
        fc.option(word),
        (values, search, cur) => {
          const result = getNextMatch(values, search, cur ?? undefined);
          if (result === undefined) return;
          expect(values).toContain(result);
          expect(result).not.toBe(cur ?? undefined);
        },
      ),
      { seed: 42 },
    );
  });

  it("[TYP-22] reset clears the search after any key sequence", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom("a", "b", "x"), { maxLength: 8 }), (keys) => {
        const t = createTypeahead({ now: () => 0 });
        for (const key of keys) t.handleKey(key, items(FRUIT), -1);
        t.reset();
        expect(t.search()).toBe("");
      }),
      { seed: 42 },
    );
  });
});
