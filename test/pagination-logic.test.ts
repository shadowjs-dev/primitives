import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  clampPage,
  getPaginationRange,
  normalizePageCount,
  type PaginationRangeItem,
} from "../src/pagination/range";

const SEED = { seed: 42 };
const config = fc.record({
  pageCount: fc.integer({ min: 1, max: 200 }),
  siblingCount: fc.integer({ min: 0, max: 6 }),
  boundaryCount: fc.integer({ min: 1, max: 6 }),
});
const scenario = config.chain((shape) =>
  fc.record({
    shape: fc.constant(shape),
    page: fc.integer({ min: 1, max: shape.pageCount }),
  }),
);

const numbersOf = (items: readonly PaginationRangeItem[]): number[] =>
  items.filter((item): item is number => typeof item === "number");

describe("getPaginationRange", () => {
  it("[PGN-L01] shows the first and last page and the current page", () => {
    fc.assert(
      fc.property(scenario, ({ shape, page }) => {
        const items = getPaginationRange({ page, ...shape });
        expect(items).toContain(1);
        expect(items).toContain(shape.pageCount);
        expect(items).toContain(page);
      }),
      SEED,
    );
  });

  it("[PGN-L02] numbers are strictly increasing, unique and inside 1..pageCount", () => {
    fc.assert(
      fc.property(scenario, ({ shape, page }) => {
        const numbers = numbersOf(getPaginationRange({ page, ...shape }));
        for (let index = 0; index < numbers.length; index += 1) {
          const value = numbers[index] ?? 0;
          expect(Number.isInteger(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(shape.pageCount);
          if (index > 0) expect(value).toBeGreaterThan(numbers[index - 1] ?? 0);
        }
      }),
      SEED,
    );
  });

  it("[PGN-L03] the number of slots does not depend on the page", () => {
    fc.assert(
      fc.property(config, (shape) => {
        const expected = Math.min(
          shape.pageCount,
          2 * shape.boundaryCount + 2 * shape.siblingCount + 3,
        );
        for (let page = 1; page <= shape.pageCount; page += 1) {
          expect(getPaginationRange({ page, ...shape })).toHaveLength(expected);
        }
      }),
      SEED,
    );
  });

  it("[PGN-L04] an ellipsis hides at least two pages, and a gap of one page shows that page", () => {
    fc.assert(
      fc.property(scenario, ({ shape, page }) => {
        const items = getPaginationRange({ page, ...shape });
        for (let index = 0; index < items.length - 1; index += 1) {
          const left = items[index];
          const right = items[index + 1];
          if (typeof left === "number" && typeof right === "number") {
            // Two neighboring numbers hide nothing.
            expect(right - left).toBe(1);
          }
        }
        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          if (typeof item === "number") continue;
          const before = items[index - 1];
          const after = items[index + 1];
          expect(typeof before).toBe("number");
          expect(typeof after).toBe("number");
          if (typeof before === "number" && typeof after === "number") {
            expect(after - before - 1).toBeGreaterThanOrEqual(2);
          }
        }
      }),
      SEED,
    );
  });

  it("[PGN-L05] each ellipsis appears at most once, on the side of the pages it hides", () => {
    fc.assert(
      fc.property(scenario, ({ shape, page }) => {
        const items = getPaginationRange({ page, ...shape });
        expect(items.filter((item) => item === "ellipsis-start").length).toBeLessThanOrEqual(1);
        expect(items.filter((item) => item === "ellipsis-end").length).toBeLessThanOrEqual(1);
        const start = items.indexOf("ellipsis-start");
        const end = items.indexOf("ellipsis-end");
        if (start !== -1) expect(start).toBeLessThan(items.indexOf(page));
        if (end !== -1) expect(end).toBeGreaterThan(items.indexOf(page));
        if (start !== -1 && end !== -1) expect(start).toBeLessThan(end);
      }),
      SEED,
    );
  });

  it("[PGN-L06] the boundary pages and the siblings of the current page are always present", () => {
    fc.assert(
      fc.property(scenario, ({ shape, page }) => {
        const numbers = new Set(numbersOf(getPaginationRange({ page, ...shape })));
        for (let value = 1; value <= Math.min(shape.boundaryCount, shape.pageCount); value += 1) {
          expect(numbers.has(value)).toBe(true);
          expect(numbers.has(shape.pageCount - value + 1)).toBe(true);
        }
        const low = Math.max(1, page - shape.siblingCount);
        const high = Math.min(shape.pageCount, page + shape.siblingCount);
        for (let value = low; value <= high; value += 1) expect(numbers.has(value)).toBe(true);
      }),
      SEED,
    );
  });

  it("[PGN-L07] a short list is shown in full, without ellipsis", () => {
    fc.assert(
      fc.property(config, (shape) => {
        const slots = 2 * shape.boundaryCount + 2 * shape.siblingCount + 3;
        const pageCount = Math.min(shape.pageCount, slots);
        for (let page = 1; page <= pageCount; page += 1) {
          expect(getPaginationRange({ page, ...shape, pageCount })).toEqual(
            Array.from({ length: pageCount }, (_, index) => index + 1),
          );
        }
      }),
      SEED,
    );
  });

  it("[PGN-L08] stepping one page changes the bar by a small, local amount", () => {
    fc.assert(
      fc.property(scenario, ({ shape, page }) => {
        if (page >= shape.pageCount) return;
        const now = new Set(getPaginationRange({ page, ...shape }));
        const next = new Set(getPaginationRange({ page: page + 1, ...shape }));
        // Moving the window by one page reveals at most one new page number (plus gap markers).
        const revealed = [...next].filter((item) => typeof item === "number" && !now.has(item));
        expect(revealed.length).toBeLessThanOrEqual(2);
      }),
      SEED,
    );
  });

  it("[PGN-L09] invalid pages are clamped: NaN, below one, beyond the end, fractions", () => {
    const base = { pageCount: 20 };
    expect(getPaginationRange({ page: Number.NaN, ...base })).toEqual(
      getPaginationRange({ page: 1, ...base }),
    );
    expect(getPaginationRange({ page: -4, ...base })).toEqual(
      getPaginationRange({ page: 1, ...base }),
    );
    expect(getPaginationRange({ page: 0, ...base })).toEqual(
      getPaginationRange({ page: 1, ...base }),
    );
    expect(getPaginationRange({ page: 99, ...base })).toEqual(
      getPaginationRange({ page: 20, ...base }),
    );
    expect(getPaginationRange({ page: 7.9, ...base })).toEqual(
      getPaginationRange({ page: 7, ...base }),
    );
    expect(getPaginationRange({ page: Number.POSITIVE_INFINITY, ...base })).toEqual(
      getPaginationRange({ page: 20, ...base }),
    );
    expect(getPaginationRange({ page: Number.NEGATIVE_INFINITY, ...base })).toEqual(
      getPaginationRange({ page: 1, ...base }),
    );
  });

  it("[PGN-L10] invalid page counts and options never throw and fall back", () => {
    for (const pageCount of [Number.NaN, 0, -3, 0.4, Number.POSITIVE_INFINITY]) {
      expect(getPaginationRange({ page: 5, pageCount })).toEqual([1]);
    }
    expect(getPaginationRange({ page: 1, pageCount: 3.9 })).toEqual([1, 2, 3]);
    const plain = getPaginationRange({ page: 10, pageCount: 30 });
    expect(getPaginationRange({ page: 10, pageCount: 30, siblingCount: Number.NaN })).toEqual(
      plain,
    );
    expect(getPaginationRange({ page: 10, pageCount: 30, boundaryCount: Number.NaN })).toEqual(
      plain,
    );
    expect(getPaginationRange({ page: 10, pageCount: 30, boundaryCount: 0 })).toEqual(plain);
    expect(getPaginationRange({ page: 10, pageCount: 30, boundaryCount: -2 })).toEqual(plain);
    expect(getPaginationRange({ page: 10, pageCount: 30, siblingCount: -5 })).toEqual(
      getPaginationRange({ page: 10, pageCount: 30, siblingCount: 0 }),
    );
    expect(
      getPaginationRange({ page: 3, pageCount: 6, siblingCount: Number.POSITIVE_INFINITY }),
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect(
      getPaginationRange({ page: 3, pageCount: 6, boundaryCount: Number.POSITIVE_INFINITY }),
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("[PGN-L11] arbitrary numeric input, including garbage, keeps every invariant", () => {
    const wild = fc.oneof(
      fc.double(),
      fc.integer({ min: -50, max: 400 }),
      fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0),
    );
    fc.assert(
      fc.property(wild, wild, wild, wild, (page, pageCount, siblingCount, boundaryCount) => {
        // Cap the count so the property stays fast; the invariants do not depend on it.
        const bounded = Number.isFinite(pageCount) ? Math.min(Math.abs(pageCount), 300) : pageCount;
        const items = getPaginationRange({
          page,
          pageCount: bounded,
          siblingCount,
          boundaryCount,
        });
        const count = normalizePageCount(bounded);
        const current = clampPage(page, count);
        expect(items).toContain(1);
        expect(items).toContain(count);
        expect(items).toContain(current);
        const numbers = numbersOf(items);
        expect(new Set(numbers).size).toBe(numbers.length);
        expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
      }),
      SEED,
    );
  });

  it("[PGN-L12] known bars", () => {
    expect(getPaginationRange({ page: 1, pageCount: 10 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis-end",
      10,
    ]);
    expect(getPaginationRange({ page: 5, pageCount: 10 })).toEqual([
      1,
      "ellipsis-start",
      4,
      5,
      6,
      "ellipsis-end",
      10,
    ]);
    expect(getPaginationRange({ page: 10, pageCount: 10 })).toEqual([
      1,
      "ellipsis-start",
      6,
      7,
      8,
      9,
      10,
    ]);
    expect(getPaginationRange({ page: 4, pageCount: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPaginationRange({ page: 4, pageCount: 8 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis-end",
      8,
    ]);
    expect(getPaginationRange({ page: 1, pageCount: 1 })).toEqual([1]);
    expect(
      getPaginationRange({ page: 8, pageCount: 40, siblingCount: 2, boundaryCount: 2 }),
    ).toEqual([1, 2, "ellipsis-start", 6, 7, 8, 9, 10, "ellipsis-end", 39, 40]);
  });

  it("[PGN-L13] a gap of exactly one page shows the page", () => {
    // Page 4 of 20: the window is 3..5, the gap before it is page 2 alone.
    const items = getPaginationRange({ page: 4, pageCount: 20 });
    expect(items.slice(0, 4)).toEqual([1, 2, 3, 4]);
    expect(items).not.toContain("ellipsis-start");
    // Page 17 of 20 mirrors it.
    expect(getPaginationRange({ page: 17, pageCount: 20 }).slice(-4)).toEqual([17, 18, 19, 20]);
  });
});

describe("clampPage and normalizePageCount", () => {
  it("[PGN-L14] clampPage always returns an existing page", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.double(), fc.integer()),
        fc.integer({ min: -5, max: 100 }),
        (page, count) => {
          const result = clampPage(page, count);
          expect(Number.isInteger(result)).toBe(true);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(normalizePageCount(count));
        },
      ),
      SEED,
    );
  });

  it("[PGN-L15] normalizePageCount floors and never goes below one", () => {
    expect(normalizePageCount(7.9)).toBe(7);
    expect(normalizePageCount(0)).toBe(1);
    expect(normalizePageCount(-9)).toBe(1);
    expect(normalizePageCount(Number.NaN)).toBe(1);
    expect(normalizePageCount(Number.POSITIVE_INFINITY)).toBe(1);
    expect(normalizePageCount(12)).toBe(12);
  });
});
