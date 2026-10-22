import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  type ComboboxFilterItem,
  comboboxDefaultFilter,
  filterComboboxItems,
  normalizeSearchText,
} from "../src/combobox/filter";

const SEED = { seed: 42 };

const itemArb = fc.record({
  value: fc.string({ minLength: 1, maxLength: 8 }),
  label: fc.string({ maxLength: 12 }),
});
const itemsArb = fc.array(itemArb, { maxLength: 20 });

describe("combobox filtering", () => {
  it("[CBXL-01] normalizeSearchText drops diacritics and case", () => {
    expect(normalizeSearchText("Crème Brûlée")).toBe("creme brulee");
    expect(normalizeSearchText("ÅNGSTRÖM")).toBe("angstrom");
    expect(normalizeSearchText("plain")).toBe("plain");
  });

  it("[CBXL-02] normalizeSearchText is idempotent", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (text) => {
        const once = normalizeSearchText(text);
        expect(normalizeSearchText(once)).toBe(once);
      }),
      SEED,
    );
  });

  it("[CBXL-03] the default filter is a case-insensitive contains", () => {
    const item = { value: "ca", label: "California" };
    expect(comboboxDefaultFilter(item, "FORN")).toBe(true);
    expect(comboboxDefaultFilter(item, "calif")).toBe(true);
    expect(comboboxDefaultFilter(item, "texas")).toBe(false);
  });

  it("[CBXL-04] the default filter is diacritic-insensitive in both directions", () => {
    expect(comboboxDefaultFilter({ value: "c", label: "Café" }, "cafe")).toBe(true);
    expect(comboboxDefaultFilter({ value: "c", label: "Cafe" }, "café")).toBe(true);
    expect(comboboxDefaultFilter({ value: "n", label: "Niño" }, "nin")).toBe(true);
  });

  it("[CBXL-05] the default filter falls back to the value for an empty label", () => {
    expect(comboboxDefaultFilter({ value: "apple", label: "" }, "app")).toBe(true);
    expect(comboboxDefaultFilter({ value: "apple", label: "" }, "pear")).toBe(false);
  });

  it("[CBXL-06] a blank query returns every item, in the same order, as a new array", () => {
    fc.assert(
      fc.property(itemsArb, fc.constantFrom("", " ", "   ", "\t"), (items, query) => {
        const result = filterComboboxItems(items, query);
        expect(result).toEqual(items);
        expect(result).not.toBe(items);
      }),
      SEED,
    );
  });

  it("[CBXL-07] filtering keeps the original relative order (stable) and never invents items", () => {
    fc.assert(
      fc.property(itemsArb, fc.string({ maxLength: 3 }), (items, query) => {
        const result = filterComboboxItems(items, query);
        let cursor = -1;
        for (const kept of result) {
          const next = items.indexOf(kept, cursor + 1);
          expect(next).toBeGreaterThan(cursor);
          cursor = next;
        }
      }),
      SEED,
    );
  });

  it("[CBXL-08] every kept item contains the normalized query and every dropped one does not", () => {
    fc.assert(
      fc.property(itemsArb, fc.string({ minLength: 1, maxLength: 3 }), (items, query) => {
        const needle = normalizeSearchText(query).trim();
        const kept = new Set<ComboboxFilterItem>(filterComboboxItems(items, query));
        for (const item of items) {
          const text = normalizeSearchText(item.label === "" ? item.value : item.label);
          const expected = needle === "" || text.includes(needle);
          expect(kept.has(item)).toBe(expected);
        }
      }),
      SEED,
    );
  });

  it("[CBXL-09] filtering is idempotent and does not mutate its input", () => {
    fc.assert(
      fc.property(itemsArb, fc.string({ maxLength: 3 }), (items, query) => {
        const copy = items.map((item) => ({ ...item }));
        const once = filterComboboxItems(items, query);
        expect(items).toEqual(copy);
        expect(filterComboboxItems(once, query)).toEqual(once);
      }),
      SEED,
    );
  });

  it("[CBXL-10] an item always matches its own label", () => {
    fc.assert(
      fc.property(itemArb, (item) => {
        expect(comboboxDefaultFilter(item, item.label)).toBe(true);
      }),
      SEED,
    );
  });

  it("[CBXL-11] a longer query never matches more than its prefix", () => {
    fc.assert(
      fc.property(
        itemsArb,
        fc.string({ maxLength: 4 }),
        fc.string({ maxLength: 2 }),
        (items, base, extra) => {
          const wide = new Set<ComboboxFilterItem>(filterComboboxItems(items, base));
          for (const item of filterComboboxItems(items, base + extra)) {
            // "ab" containing "ab" + "c" implies it contains "ab"; blank prefixes are the whole list.
            expect(wide.has(item)).toBe(true);
          }
        },
      ),
      SEED,
    );
  });

  it("[CBXL-12] a custom matcher is used for non-blank queries and skipped for blank ones", () => {
    const calls: string[] = [];
    const startsWith = (item: ComboboxFilterItem, query: string): boolean => {
      calls.push(query);
      return item.label.toLowerCase().startsWith(query.toLowerCase());
    };
    const items = [
      { value: "a", label: "Apple" },
      { value: "b", label: "Pineapple" },
    ];
    expect(filterComboboxItems(items, "app", startsWith)).toEqual([items[0]]);
    expect(filterComboboxItems(items, "  ", startsWith)).toEqual(items);
    expect(calls).toEqual(["app", "app"]);
  });
});
