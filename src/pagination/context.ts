import { type Accessor, useMemo } from "@shadow-js/core";
import {
  createPartContext,
  type Direction,
  type PartContext,
  useControllableState,
  useDirection,
} from "../utils/index";
import {
  clampPage,
  getPaginationRange,
  normalizePageCount,
  type PaginationRangeItem,
} from "./range";

/**
 * Own props of {@link PaginationRoot}, on top of the attributes of the `nav` element.
 *
 * Accessibility: the root is a `nav` landmark named "pagination" unless `aria-label` says otherwise.
 * The current page item has `aria-current="page"`; the Previous and Next controls are named "Go to
 * previous page" and "Go to next page". A disabled control keeps its place and has `aria-disabled`
 * (a disabled link also loses its `href`). Keys: each item is an ordinary tab stop, activated with the
 * native Enter key (links) or Enter and Space (buttons).
 *
 * Data attributes: `data-disabled` (present, value `""`) on the root and on each disabled control;
 * `data-state` (`"active"` or `"inactive"`) on each item and control; `dir` on the root only when given.
 * @since 1.0.0
 * @see {@link PaginationRoot}
 */
export interface PaginationOwnProps {
  /**
   * Controlled current page, starting at 1. The current page is clamped into `1..pageCount`.
   * @default none (uncontrolled)
   */
  readonly page?: number | undefined;
  /**
   * Initial page when uncontrolled.
   * @default 1
   */
  readonly defaultPage?: number | undefined;
  /**
   * Called with the new page when the user asks for another one. Not called for the current page.
   * @default none
   */
  readonly onPageChange?: ((page: number) => void) | undefined;
  /**
   * The number of pages. Fractions are floored; values below `1` and non-finite values count as `1`.
   * @default 1
   */
  readonly pageCount?: number | undefined;
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
  /**
   * Disables every item, `Previous` and `Next`: they stay in the DOM and can neither change the page
   * nor navigate.
   * @default false
   */
  readonly disabled?: boolean | undefined;
  /**
   * Reading direction. Written to the `dir` attribute of the navigation only when given here; the
   * inherited direction is used for the layout without being written to the markup.
   * @default none (inherits the `DirectionProvider`, then the document, then `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * The accessible name of a page item. `current` is `true` for the current page.
   * @default none (the name is "Go to page N", see {@link defaultItemLabel})
   */
  readonly getItemLabel?: ((page: number, current: boolean) => string) | undefined;
  /**
   * Makes the items links: returns the `href` of a page. Without it the items are buttons.
   * @default none (items are buttons)
   */
  readonly getHref?: ((page: number) => string) | undefined;
}

/**
 * What every pagination part reads from its root. @internal
 * @see {@link Pagination}
 */
export interface PaginationContextValue {
  /** The current page, always inside `1..pageCount`. */
  readonly page: Accessor<number>;
  /** Asks for another page: clamped, ignored when disabled or unchanged. */
  readonly setPage: (page: number) => void;
  readonly pageCount: Accessor<number>;
  readonly disabled: Accessor<boolean>;
  readonly dir: Accessor<Direction>;
  /** The slots of the bar for the current page. */
  readonly range: Accessor<PaginationRangeItem[]>;
  readonly getItemLabel: (page: number, current: boolean) => string;
  /** Whether items are links. */
  readonly hasHref: Accessor<boolean>;
  readonly getHref: (page: number) => string | undefined;
}

/**
 * The context the pagination root provides to its parts. Read it only to build a custom part of a
 * pagination bar; `use` throws when the part is outside a `Pagination`.
 * @since 1.0.0
 * @example
 * import { paginationContext } from "@shadow-js/primitives";
 *
 * export function CurrentPageLabel() {
 *   const pagination = paginationContext.use("CurrentPageLabel");
 *   return <span>Page {pagination.page()}</span>;
 * }
 * @see {@link PaginationContextValue}
 */
export const paginationContext: PartContext<PaginationContextValue> =
  createPartContext<PaginationContextValue>("Pagination");

/**
 * The default accessible name of a page item: `"Go to page N"`. Used when the root has no
 * `getItemLabel`.
 *
 * @param page The page number.
 * @returns The label text.
 * @example
 * import { defaultItemLabel } from "@shadow-js/primitives";
 *
 * export const label = defaultItemLabel(3); // "Go to page 3"
 * @since 1.0.0
 * @see {@link PaginationOwnProps}
 */
export function defaultItemLabel(page: number): string {
  return `Go to page ${page}`;
}

/**
 * Builds the state every pagination part shares. @internal
 * @see {@link Pagination}
 */
export function createPaginationContext(props: PaginationOwnProps): PaginationContextValue {
  const pageCount = (): number => normalizePageCount(props.pageCount ?? 1);
  const [rawPage, setRawPage] = useControllableState<number>({
    value: () => props.page,
    defaultValue: () => props.defaultPage ?? 1,
    onChange: () => props.onPageChange,
    name: "Pagination page",
  });
  const page = useMemo((): number => clampPage(rawPage(), pageCount()));
  const disabled = (): boolean => props.disabled === true;
  const range = useMemo(() =>
    getPaginationRange({
      page: page(),
      pageCount: pageCount(),
      siblingCount: props.siblingCount,
      boundaryCount: props.boundaryCount,
    }),
  );
  return {
    page,
    setPage(next) {
      if (disabled()) return;
      const target = clampPage(next, pageCount());
      if (target !== page()) setRawPage(target);
    },
    pageCount,
    disabled,
    dir: useDirection(() => props.dir),
    range,
    getItemLabel: (target, current) =>
      props.getItemLabel === undefined
        ? defaultItemLabel(target)
        : props.getItemLabel(target, current),
    hasHref: () => props.getHref !== undefined,
    getHref: (target) => props.getHref?.(target),
  };
}
