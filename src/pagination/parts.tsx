import { splitProps } from "@shadow-js/core";
import { For } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { paginationContext } from "./context";
import { PageLink } from "./link";
import type { PaginationRangeItem } from "./range";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link PaginationList}: the attributes of the `ul`.
 * @since 1.0.0
 * @see {@link PaginationList}
 */
export type PaginationListProps<T extends PolymorphicTarget = "ul"> = PolymorphicProps<
  "ul",
  object,
  T
>;

/**
 * Own props shared by the parts that render a list item around a page control.
 *
 * Data attributes on the `li`: `data-state` (`"active"` or `"inactive"`, `"active"` for the current
 * page) and `data-disabled` (present, value `""`) while the control is disabled. Props given here
 * are merged onto that `li`.
 * @since 1.0.0
 * @see {@link PaginationItem}
 */
export interface PaginationItemOwnProps {
  /**
   * Attributes for the surrounding `li` (class, data attributes, ref).
   * @default none
   */
  readonly itemProps?: Record<string, unknown> | undefined;
}

/**
 * Own props of {@link PaginationItem}, on top of the attributes of the link or button.
 *
 * Accessibility: the current page carries `aria-current="page"`; the name is "Go to page N" unless
 * the root's `getItemLabel` says otherwise. Data attributes on the link or button: `data-state`
 * (`"active"` for the current page, `"inactive"` otherwise) and `data-disabled` while disabled.
 * @since 1.0.0
 * @see {@link PaginationItem}
 */
export interface PaginationPageOwnProps extends PaginationItemOwnProps {
  /**
   * The page this item goes to, starting at 1.
   * @default none (required)
   */
  readonly page: number;
}

/**
 * Props of {@link PaginationItem}: the attributes of the link (or button), plus `page`.
 * @since 1.0.0
 * @see {@link PaginationPageOwnProps}
 */
export type PaginationItemProps<T extends PolymorphicTarget = "a"> = PolymorphicProps<
  "a",
  PaginationPageOwnProps,
  T
>;

/**
 * Props of {@link PaginationPrevious}: the attributes of the link (or button).
 * @since 1.0.0
 * @see {@link PaginationPrevious}
 */
export type PaginationPreviousProps<T extends PolymorphicTarget = "a"> = PolymorphicProps<
  "a",
  PaginationItemOwnProps,
  T
>;

/**
 * Props of {@link PaginationNext}: the attributes of the link (or button).
 * @since 1.0.0
 * @see {@link PaginationNext}
 */
export type PaginationNextProps<T extends PolymorphicTarget = "a"> = PolymorphicProps<
  "a",
  PaginationItemOwnProps,
  T
>;

/**
 * Props of {@link PaginationEllipsis}: the attributes of the `span`.
 * @since 1.0.0
 * @see {@link PaginationEllipsis}
 */
export type PaginationEllipsisProps<T extends PolymorphicTarget = "span"> = PolymorphicProps<
  "span",
  PaginationItemOwnProps,
  T
>;

/**
 * Own props of {@link PaginationItems}.
 * @since 1.0.0
 * @see {@link PaginationItems}
 */
export interface PaginationItemsProps {
  /**
   * Renders one slot of the bar: a page number or an ellipsis. Called once per distinct slot, so
   * the element of a page that stays in the bar is kept (and keeps focus) while the user pages.
   * @default none (a `Pagination.Item` per page and a `Pagination.Ellipsis` per gap)
   */
  readonly children?: ((item: PaginationRangeItem) => JsxChild) | undefined;
}

/**
 * The list of the bar. Renders a `ul`. Keyboard: the list handles no keys; the items are the tab
 * stops. ARIA: the list sets no role or ARIA attribute of its own.
 *
 * @param props See {@link PaginationListProps}.
 * @returns The `ul` element.
 * @throws Error when rendered outside {@link PaginationRoot}.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function BarList() {
 *   return (
 *     <Pagination pageCount={5}>
 *       <Pagination.List class="flex gap-1">
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
export function PaginationList<T extends PolymorphicTarget = "ul">(
  props: PaginationListProps<T>,
): JsxChild {
  paginationContext.use("Pagination.List");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(rest);
  return <Polymorphic as={own.as ?? "ul"} {...merged} />;
}

/** The `li` around a page control. */
function ItemShell(shell: {
  readonly itemProps: Record<string, unknown> | undefined;
  readonly current: () => boolean;
  readonly disabled: () => boolean;
  readonly children?: JsxChild;
}): JsxChild {
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return shell.current() ? "active" : "inactive";
      },
      get "data-disabled"() {
        return shell.disabled() ? "" : undefined;
      },
    },
    shell.itemProps,
  );
  return <li {...merged}>{shell.children}</li>;
}

/**
 * A page of the bar: an `li` holding a link (when the root has `getHref`) or a button that goes to
 * `page`. The one for the current page has `aria-current="page"`; its accessible name is
 * "Go to page N" unless the root's `getItemLabel` says otherwise. `as`, class and handlers apply
 * to the link or button; `itemProps` to the `li`. Keys: Enter (links) or Enter and Space (buttons).
 * Must be rendered inside {@link PaginationRoot}.
 *
 * @param props See {@link PaginationItemProps}.
 * @returns The `li` element around the link or button.
 * @throws Error when rendered outside {@link PaginationRoot}.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function ThirdPage() {
 *   return (
 *     <Pagination pageCount={10} defaultPage={3}>
 *       <Pagination.List>
 *         <Pagination.Item page={3} class="btn">3</Pagination.Item>
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PaginationPageOwnProps}
 */
export function PaginationItem<T extends PolymorphicTarget = "a">(
  props: PaginationItemProps<T>,
): JsxChild {
  const context = paginationContext.use("Pagination.Item");
  const [own, rest] = splitProps(partProps<Loose & PaginationPageOwnProps>(props), [
    "as",
    "page",
    "itemProps",
    "onClick",
    "children",
  ]);
  const current = (): boolean => own.page === context.page();
  const disabled = (): boolean => context.disabled();
  return (
    <ItemShell itemProps={own.itemProps} current={current} disabled={disabled}>
      <PageLink
        target={() => own.page}
        current={current}
        disabled={disabled}
        label={() => context.getItemLabel(own.page, current())}
        as={own.as}
        onClick={own["onClick"]}
        rest={rest}
      >
        {own["children"] as JsxChild}
      </PageLink>
    </ItemShell>
  );
}

/**
 * Goes to the previous page. Named "Go to previous page" (its `aria-label`), with `rel="prev"` when it
 * is a link. Disabled (`aria-disabled`, `data-disabled`) on the first page, but it stays in the DOM
 * so the bar does not shift. Must be rendered inside {@link PaginationRoot}.
 *
 * @param props See {@link PaginationPreviousProps}.
 * @returns The `li` element around the link or button.
 * @throws Error when rendered outside {@link PaginationRoot}.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function PrevControl() {
 *   return (
 *     <Pagination pageCount={10} defaultPage={2}>
 *       <Pagination.List>
 *         <Pagination.Previous>Previous</Pagination.Previous>
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PaginationNext}
 */
export function PaginationPrevious<T extends PolymorphicTarget = "a">(
  props: PaginationPreviousProps<T>,
): JsxChild {
  const context = paginationContext.use("Pagination.Previous");
  const [own, rest] = splitProps(partProps<Loose & PaginationItemOwnProps>(props), [
    "as",
    "itemProps",
    "onClick",
    "children",
  ]);
  const disabled = (): boolean => context.disabled() || context.page() <= 1;
  return (
    <ItemShell itemProps={own.itemProps} current={() => false} disabled={disabled}>
      <PageLink
        target={() => Math.max(1, context.page() - 1)}
        current={() => false}
        disabled={disabled}
        label={() => "Go to previous page"}
        rel="prev"
        as={own.as}
        onClick={own["onClick"]}
        rest={rest}
      >
        {own["children"] as JsxChild}
      </PageLink>
    </ItemShell>
  );
}

/**
 * Goes to the next page. Named "Go to next page", with `rel="next"` when it is a link. Disabled
 * (`aria-disabled`, `data-disabled`) on the last page, but it stays in the DOM so the bar does not
 * shift. Must be rendered inside {@link PaginationRoot}.
 *
 * @param props See {@link PaginationNextProps}.
 * @returns The `li` element around the link or button.
 * @throws Error when rendered outside {@link PaginationRoot}.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function NextControl() {
 *   return (
 *     <Pagination pageCount={10} defaultPage={2}>
 *       <Pagination.List>
 *         <Pagination.Next>Next</Pagination.Next>
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PaginationPrevious}
 */
export function PaginationNext<T extends PolymorphicTarget = "a">(
  props: PaginationNextProps<T>,
): JsxChild {
  const context = paginationContext.use("Pagination.Next");
  const [own, rest] = splitProps(partProps<Loose & PaginationItemOwnProps>(props), [
    "as",
    "itemProps",
    "onClick",
    "children",
  ]);
  const disabled = (): boolean => context.disabled() || context.page() >= context.pageCount();
  return (
    <ItemShell itemProps={own.itemProps} current={() => false} disabled={disabled}>
      <PageLink
        target={() => Math.min(context.pageCount(), context.page() + 1)}
        current={() => false}
        disabled={disabled}
        label={() => "Go to next page"}
        rel="next"
        as={own.as}
        onClick={own["onClick"]}
        rest={rest}
      >
        {own["children"] as JsxChild}
      </PageLink>
    </ItemShell>
  );
}

/**
 * A gap standing for hidden pages. The `li` is `aria-hidden="true"`, so assistive technology neither
 * reads it nor counts it as a list item; the visual `…` (or your children) goes in a `span`. Must be
 * rendered inside {@link PaginationRoot}.
 *
 * @param props See {@link PaginationEllipsisProps}.
 * @returns The `li` element with the `span` inside.
 * @throws Error when rendered outside {@link PaginationRoot}.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function Gap() {
 *   return (
 *     <Pagination pageCount={10}>
 *       <Pagination.List>
 *         <Pagination.Ellipsis />
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PaginationItems}
 */
export function PaginationEllipsis<T extends PolymorphicTarget = "span">(
  props: PaginationEllipsisProps<T>,
): JsxChild {
  paginationContext.use("Pagination.Ellipsis");
  const [own, rest] = splitProps(partProps<Loose & PaginationItemOwnProps>(props), [
    "as",
    "itemProps",
    "children",
  ]);
  const shell = mergeElementProps({ "aria-hidden": "true" }, own.itemProps);
  const merged = mergeElementProps(rest);
  return (
    <li {...shell}>
      <Polymorphic as={own.as ?? "span"} {...merged}>
        {(own["children"] as JsxChild | undefined) ?? "…"}
      </Polymorphic>
    </li>
  );
}

/**
 * Renders the whole bar for the current page and options of the root: pass a render function to
 * draw each slot yourself, or none to get a `Pagination.Item` per page and an ellipsis per gap.
 * The number of slots is constant while the user pages (see `getPaginationRange`). Must be rendered
 * inside {@link PaginationRoot}. Keyboard: it handles no keys. ARIA: it sets no role or ARIA attribute
 * of its own; the page controls it renders set their own (`aria-current` on the current page).
 *
 * @param props See {@link PaginationItemsProps}.
 * @returns The slots of the bar for the current page.
 * @throws Error when rendered outside {@link PaginationRoot}.
 * @example
 * import { Pagination } from "@shadow-js/primitives";
 *
 * export function CustomBar() {
 *   return (
 *     <Pagination pageCount={10} defaultPage={1}>
 *       <Pagination.List>
 *         <Pagination.Previous>Prev</Pagination.Previous>
 *         <Pagination.Items>
 *           {(item) =>
 *             typeof item === "number" ? (
 *               <Pagination.Item page={item}>{item}</Pagination.Item>
 *             ) : (
 *               <Pagination.Ellipsis />
 *             )
 *           }
 *         </Pagination.Items>
 *         <Pagination.Next>Next</Pagination.Next>
 *       </Pagination.List>
 *     </Pagination>
 *   );
 * }
 * @since 1.0.0
 * @see {@link getPaginationRange}
 */
export function PaginationItems(props: PaginationItemsProps): JsxChild {
  const context = paginationContext.use("Pagination.Items");
  return (
    <For each={context.range()}>
      {(item: PaginationRangeItem): JsxChild => {
        const render = props.children;
        if (render !== undefined) return render(item);
        if (typeof item === "number") return <PaginationItem page={item}>{item}</PaginationItem>;
        return <PaginationEllipsis />;
      }}
    </For>
  );
}
