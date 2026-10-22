import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { createPaginationContext, type PaginationOwnProps, paginationContext } from "./context";

/**
 * Props of {@link PaginationRoot}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link PaginationOwnProps}
 */
export type PaginationProps<T extends PolymorphicTarget = "nav"> = PolymorphicProps<
  "nav",
  PaginationOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "page",
  "defaultPage",
  "onPageChange",
  "pageCount",
  "siblingCount",
  "boundaryCount",
  "disabled",
  "dir",
  "getItemLabel",
  "getHref",
] as const;

/**
 * Page navigation: a `nav` landmark named "pagination" (override with `aria-label`) that holds
 * the page list. Controlled with `page` / `onPageChange` or uncontrolled with `defaultPage`.
 * The current page is clamped into `1..pageCount`, so a shrinking list never leaves the bar on a
 * page that does not exist.
 *
 * Keys: the items are ordinary tab stops; Enter (links) or Enter and Space (buttons) goes to the
 * page. ARIA: a `nav` landmark; the current item has `aria-current="page"`; Previous and Next are
 * named by direction and carry `aria-disabled` at the ends. Follows the WAI-ARIA landmark and link
 * practice: the items are links (with `getHref`) or buttons. Data attributes: `data-disabled` (value `""`) on the `nav` while the root is disabled.
 *
 * @param props See {@link PaginationProps}.
 * @returns The `nav` element that provides the pagination state to its parts.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function ResultsPages() {
 *   return (
 *     <Pagination pageCount={20} defaultPage={3} onPageChange={(page) => console.info(page)}>
 *       <Pagination.List>
 *         <Pagination.Previous>Previous</Pagination.Previous>
 *         <Pagination.Items />
 *         <Pagination.Next>Next</Pagination.Next>
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PaginationOwnProps}
 */
export function PaginationRoot<T extends PolymorphicTarget = "nav">(
  props: PaginationProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & PaginationOwnProps>(props), OWN_KEYS);
  const context = createPaginationContext({
    get page() {
      return own.page;
    },
    get defaultPage() {
      return own.defaultPage;
    },
    get onPageChange() {
      return own.onPageChange;
    },
    get pageCount() {
      return own.pageCount;
    },
    get siblingCount() {
      return own.siblingCount;
    },
    get boundaryCount() {
      return own.boundaryCount;
    },
    get disabled() {
      return own.disabled;
    },
    get dir() {
      return own.dir;
    },
    get getItemLabel() {
      return own.getItemLabel;
    },
    get getHref() {
      return own.getHref;
    },
  });
  const merged = mergeElementProps(
    {
      "aria-label": "pagination",
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      // Only an explicit `dir` is written: the inherited one is resolved on the client alone, and
      // markup must not differ between the server and the first client render.
      get dir() {
        return own.dir;
      },
    },
    rest,
  );
  return (
    <paginationContext.Provider value={context}>
      <Polymorphic as={own.as ?? "nav"} {...merged} />
    </paginationContext.Provider>
  );
}
