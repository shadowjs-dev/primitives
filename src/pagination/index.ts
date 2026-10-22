import {
  PaginationEllipsis,
  PaginationItem,
  PaginationItems,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "./parts";
import { PaginationRoot } from "./root";

export type { PaginationContextValue, PaginationOwnProps } from "./context";
export { createPaginationContext, defaultItemLabel, paginationContext } from "./context";
export type {
  PaginationEllipsisProps,
  PaginationItemOwnProps,
  PaginationItemProps,
  PaginationItemsProps,
  PaginationListProps,
  PaginationNextProps,
  PaginationPageOwnProps,
  PaginationPreviousProps,
} from "./parts";
export type { PaginationRangeItem, PaginationRangeOptions } from "./range";
export { clampPage, getPaginationRange, normalizePageCount } from "./range";
export type { PaginationProps } from "./root";
export {
  PaginationEllipsis,
  PaginationItem,
  PaginationItems,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  PaginationRoot,
};

/**
 * The pagination primitive: `Pagination`, `Pagination.List`, `Pagination.Item`,
 * `Pagination.Previous`, `Pagination.Next`, `Pagination.Ellipsis` and `Pagination.Items`, plus the
 * pure {@link getPaginationRange}. Each part is also exported by name (`PaginationItem`, ...) for
 * tree shaking. Keys: items are ordinary tab stops, activated with Enter (links) or Enter and Space
 * (buttons). ARIA: a `nav` landmark named "pagination"; the current item has `aria-current="page"`;
 * disabled controls carry `aria-disabled`.
 *
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function ArticlePages() {
 *   return (
 *     <Pagination pageCount={10} defaultPage={1}>
 *       <Pagination.List>
 *         <Pagination.Previous>Previous</Pagination.Previous>
 *         <Pagination.Items />
 *         <Pagination.Next>Next</Pagination.Next>
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PaginationRoot}
 */
export const Pagination: typeof PaginationRoot & {
  readonly List: typeof PaginationList;
  readonly Item: typeof PaginationItem;
  readonly Previous: typeof PaginationPrevious;
  readonly Next: typeof PaginationNext;
  readonly Ellipsis: typeof PaginationEllipsis;
  readonly Items: typeof PaginationItems;
} = Object.assign((props: Parameters<typeof PaginationRoot>[0]) => PaginationRoot(props), {
  List: PaginationList,
  Item: PaginationItem,
  Previous: PaginationPrevious,
  Next: PaginationNext,
  Ellipsis: PaginationEllipsis,
  Items: PaginationItems,
});
