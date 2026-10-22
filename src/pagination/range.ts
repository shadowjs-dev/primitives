/**
 * The pure math of pagination: which page numbers to show for a given page, and where the gaps
 * go. Kept free of DOM and framework code so it can be property-tested.
 * @packageDocumentation
 */

/**
 * One slot of a pagination bar: a page number, or a gap that stands for hidden pages before
 * (`"ellipsis-start"`) or after (`"ellipsis-end"`) the pages around the current one.
 * @since 1.0.0
 * @see {@link getPaginationRange}
 */
export type PaginationRangeItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Input of {@link getPaginationRange}.
 * @since 1.0.0
 * @see {@link getPaginationRange}
 */
export interface PaginationRangeOptions {
  /**
   * The current page, starting at 1. Clamped into `1..pageCount`; NaN counts as 1.
   * @default none (required)
   */
  readonly page: number;
  /**
   * The number of pages. Floored; NaN, infinity and anything below 1 count as 1.
   * @default none (required)
   */
  readonly pageCount: number;
  /**
   * Pages shown on each side of the current page.
   * @default 1
   */
  readonly siblingCount?: number | undefined;
  /**
   * Pages always shown at the start and at the end. At least `1`.
   * @default 1
   */
  readonly boundaryCount?: number | undefined;
}

/** A count that must be a whole number of at least `min`, `fallback` when it is not a number. */
function wholeNumber(value: number | undefined, fallback: number, min: number): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return Math.max(min, Math.floor(value));
}

/**
 * The page count the other helpers work with: a whole number, at least `1`.
 *
 * @param pageCount The raw count.
 * @returns The count to use.
 * @example
 * import { normalizePageCount } from "@shadow-js/primitives";
 *
 * export const fromNaN = normalizePageCount(Number.NaN); // 1
 * export const floored = normalizePageCount(7.9); // 7
 * @since 1.0.0
 * @see {@link clampPage}
 */
export function normalizePageCount(pageCount: number): number {
  // An infinite count cannot be listed or paged through; treating it as invalid keeps loops finite.
  return Number.isFinite(pageCount) ? wholeNumber(pageCount, 1, 1) : 1;
}

/**
 * Clamps a page into `1..pageCount`. NaN counts as the first page, a fraction is floored.
 *
 * @param page The raw page.
 * @param pageCount The number of pages.
 * @returns A whole page number that exists.
 * @example
 * import { clampPage } from "@shadow-js/primitives";
 *
 * export const beyondEnd = clampPage(99, 10); // 10
 * export const belowStart = clampPage(0, 10); // 1
 * export const notANumber = clampPage(Number.NaN, 10); // 1
 * @since 1.0.0
 * @see {@link normalizePageCount}
 */
export function clampPage(page: number, pageCount: number): number {
  const count = normalizePageCount(pageCount);
  if (Number.isNaN(page)) return 1;
  return Math.min(count, Math.max(1, Math.floor(page)));
}

/**
 * The slots of a pagination bar for the current page. The first and last pages are always there,
 * and so are the current page and its `siblingCount` neighbors on each side. The pages in
 * between collapse into `"ellipsis-start"` / `"ellipsis-end"`, but only when the gap holds two
 * pages or more: a gap of exactly one page shows that page instead, because an ellipsis that
 * hides a single page saves no room and costs a click.
 *
 * The number of slots does not depend on the current page: it is
 * `min(pageCount, 2 * boundaryCount + 2 * siblingCount + 3)`. A bar that keeps its width while the
 * user pages does not make the buttons jump under the pointer.
 *
 * Invalid input is clamped (see {@link PaginationRangeOptions}); this never throws.
 *
 * @param options The page, the page count and the shape of the bar.
 * @returns The slots in order.
 * @example
 * import { getPaginationRange } from "@shadow-js/primitives";
 *
 * export const firstPage = getPaginationRange({ page: 1, pageCount: 10 }); // [1, 2, 3, 4, 5, "ellipsis-end", 10]
 * export const middlePage = getPaginationRange({ page: 5, pageCount: 10 }); // [1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 10]
 * export const lastPage = getPaginationRange({ page: 10, pageCount: 10 }); // [1, "ellipsis-start", 6, 7, 8, 9, 10]
 * @since 1.0.0
 * @see {@link PaginationRangeOptions}
 */
export function getPaginationRange(options: PaginationRangeOptions): PaginationRangeItem[] {
  const count = normalizePageCount(options.pageCount);
  const page = clampPage(options.page, count);
  // Neither can usefully exceed the number of pages; the cap also keeps an infinite value finite.
  const sibling = Math.min(count, wholeNumber(options.siblingCount, 1, 0));
  const boundary = Math.min(count, wholeNumber(options.boundaryCount, 1, 1));
  // Two boundaries, the window around the page, and one slot for each gap.
  const slots = 2 * boundary + 2 * sibling + 3;
  const items: PaginationRangeItem[] = [];
  if (count <= slots) {
    for (let value = 1; value <= count; value += 1) items.push(value);
    return items;
  }
  // The window of `2 * sibling + 1` pages is slid along with the page and then pinned so it never
  // touches or overlaps a boundary: the gaps on either side stay at least one page wide.
  const windowStart = Math.max(
    Math.min(page - sibling, count - boundary - 2 * sibling - 1),
    boundary + 2,
  );
  const windowEnd = Math.min(
    Math.max(page + sibling, boundary + 2 * sibling + 2),
    count - boundary - 1,
  );
  for (let value = 1; value <= boundary; value += 1) items.push(value);
  // The gap before the window holds `windowStart - boundary - 1` pages: one page is shown itself.
  items.push(windowStart - boundary - 1 >= 2 ? "ellipsis-start" : boundary + 1);
  for (let value = windowStart; value <= windowEnd; value += 1) items.push(value);
  items.push(count - boundary - windowEnd >= 2 ? "ellipsis-end" : count - boundary);
  for (let value = count - boundary + 1; value <= count; value += 1) items.push(value);
  return items;
}
