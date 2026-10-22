import { getOwner, onCleanup, runWithOwner, splitProps, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { whileMounted } from "../popover/mounted";
import {
  composeEventHandlers,
  getTabbables,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { navigationMenuContext, navigationMenuItemContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link NavigationMenuList}: the attributes of the `ul`.
 * @since 1.0.0
 * @see {@link NavigationMenuList}
 */
export type NavigationMenuListProps<T extends PolymorphicTarget = "ul"> = PolymorphicProps<
  "ul",
  object,
  T
>;

/**
 * The top-level row of items. Renders a `ul` with `data-orientation`. The triggers of the menu form
 * one roving group (the arrow keys, Home and End move between them). Must be rendered inside
 * {@link NavigationMenuRoot}.
 *
 * @param props See {@link NavigationMenuListProps}.
 * @returns The `ul` element.
 * @throws Error when rendered outside {@link NavigationMenuRoot}.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function TopLevel() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List class="flex gap-2">
 *         <NavigationMenu.Item value="docs">
 *           <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuRoot}
 */
export function NavigationMenuList<T extends PolymorphicTarget = "ul">(
  props: NavigationMenuListProps<T>,
): JsxChild {
  const context = navigationMenuContext.use("NavigationMenu.List");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return context.orientation();
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "ul"} {...merged} />;
}

/**
 * Own props of {@link NavigationMenuItem}, on top of the attributes of the `li` element.
 *
 * Accessibility: the item adds no role; its trigger and content are linked through `value`, which
 * builds their ids. Data attributes: `data-value` (the item's `value`) on the `li`.
 * @since 1.0.0
 * @see {@link NavigationMenuItem}
 */
export interface NavigationMenuItemOwnProps {
  /**
   * Identifies the item: its trigger and its content are wired by it. Unique in the menu.
   * @default none (required)
   */
  readonly value: string;
}

/**
 * Props of {@link NavigationMenuItem}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link NavigationMenuItemOwnProps}
 */
export type NavigationMenuItemProps<T extends PolymorphicTarget = "li"> = PolymorphicProps<
  "li",
  NavigationMenuItemOwnProps,
  T
>;

/**
 * One item of the list: an `li` that groups a trigger and its content. See
 * {@link NavigationMenuItemProps}. Must be rendered inside {@link NavigationMenuRoot}.
 *
 * @param props See {@link NavigationMenuItemProps}.
 * @returns The `li` element.
 * @throws Error when rendered outside {@link NavigationMenuRoot}.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function ProductsItem() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="products">
 *           <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/products">All products</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuItemOwnProps}
 */
export function NavigationMenuItem<T extends PolymorphicTarget = "li">(
  props: NavigationMenuItemProps<T>,
): JsxChild {
  navigationMenuContext.use("NavigationMenu.Item");
  const [own, rest] = splitProps(partProps<Loose & NavigationMenuItemOwnProps>(props), [
    "as",
    "value",
  ]);
  const item = { value: String(own.value) };
  const merged = mergeElementProps(
    {
      get "data-value"() {
        return item.value;
      },
    },
    rest,
  );
  return (
    <navigationMenuItemContext.Provider value={item}>
      <Polymorphic as={own.as ?? "li"} {...merged} />
    </navigationMenuItemContext.Provider>
  );
}

/**
 * Props of {@link NavigationMenuTrigger}: the attributes of the `button`.
 * @since 1.0.0
 * @see {@link NavigationMenuTrigger}
 */
export type NavigationMenuTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * The button that opens its item's content. Keys: Enter and Space (a click) toggle the content,
 * ArrowDown opens it and moves focus into it, Left and Right move to the neighboring trigger, Home
 * and End to the first and last. ARIA: `aria-expanded` is the open state, `aria-controls` names the
 * content only while it is open, `data-state` is `"open"` or `"closed"`. Pointer rest opens it after
 * the menu's `delayDuration`.
 *
 * @param props See {@link NavigationMenuTriggerProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link NavigationMenuRoot} or its `NavigationMenu.Item`.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function ProductsTrigger() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="products">
 *           <NavigationMenu.Trigger class="nav-trigger">Products</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/products">All products</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuContent}
 */
export function NavigationMenuTrigger<T extends PolymorphicTarget = "button">(
  props: NavigationMenuTriggerProps<T>,
): JsxChild {
  const context = navigationMenuContext.use("NavigationMenu.Trigger");
  const item = navigationMenuItemContext.use("NavigationMenu.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "onClick",
    "onKeyDown",
    "onPointerEnter",
    "onPointerLeave",
  ]);
  const isOpen = (): boolean => context.value() === item.value;
  const roving = context.roving.item({ id: () => item.value, active: isOpen });
  const merged = mergeElementProps(
    roving,
    {
      type: "button",
      get id() {
        return context.triggerId(item.value);
      },
      get "aria-expanded"() {
        return isOpen();
      },
      get "aria-controls"() {
        return isOpen() ? context.contentId(item.value) : undefined;
      },
      get "data-state"() {
        return isOpen() ? "open" : "closed";
      },
      ref: (element: HTMLElement) => {
        context.registerTrigger(item.value, element);
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          context.open(isOpen() ? undefined : item.value, "click");
        },
      ),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event: KeyboardEvent) => {
          if (event.key !== "ArrowDown") return;
          event.preventDefault();
          context.open(item.value, "keyboard");
        },
      ),
      onPointerEnter: composeEventHandlers(
        () => own.onPointerEnter as ((event: PointerEvent) => void) | undefined,
        () => {
          context.scheduleOpen(() => context.open(item.value, "pointer"));
        },
      ),
      onPointerLeave: composeEventHandlers(
        () => own.onPointerLeave as ((event: PointerEvent) => void) | undefined,
        () => context.cancelTimer(),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * Own props of {@link NavigationMenuContent}, on top of the attributes of the `div` element.
 *
 * Accessibility: the content has `aria-labelledby` pointing at its trigger and the `id` the trigger's
 * `aria-controls` names while open. Data attributes: `data-state` (`"open"` or `"closed"`) and
 * `data-orientation`.
 * @since 1.0.0
 * @see {@link NavigationMenuContent}
 */
export interface NavigationMenuContentOwnProps {
  /**
   * Keep the content mounted while closed (for animation libraries). Without it the content is
   * removed when it closes, once any exit animation has ended.
   * @default false
   */
  readonly forceMount?: boolean | undefined;
}

/**
 * Props of {@link NavigationMenuContent}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link NavigationMenuContentOwnProps}
 */
export type NavigationMenuContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  NavigationMenuContentOwnProps,
  T
>;

/**
 * The flyout of an item. Mounted only while its item is open (or with `forceMount`). When it opened
 * from the keyboard, focus moves to its first tabbable element; Escape closes it and returns focus to
 * the trigger. Must be rendered inside a `NavigationMenu.Item`.
 *
 * @param props See {@link NavigationMenuContentProps}.
 * @returns The `div` element while mounted, otherwise nothing.
 * @throws Error when rendered outside {@link NavigationMenuRoot} or its `NavigationMenu.Item`.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function ProductsContent() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="products">
 *           <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *           <NavigationMenu.Content class="flyout">
 *             <NavigationMenu.Link href="/products">All products</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuTrigger}
 */
export function NavigationMenuContent<T extends PolymorphicTarget = "div">(
  props: NavigationMenuContentProps<T>,
): JsxChild {
  const context = navigationMenuContext.use("NavigationMenu.Content");
  const item = navigationMenuItemContext.use("NavigationMenu.Content");
  const [own, rest] = splitProps(partProps<Loose & NavigationMenuContentOwnProps>(props), [
    "as",
    "forceMount",
  ]);
  const isOpen = (): boolean => context.value() === item.value;
  const presence = usePresence(() => isOpen() || own.forceMount === true);
  let element: HTMLElement | undefined;

  // The component body runs once, but its element is created each time the content opens, so the
  // effect tracks the mounted state and runs again on every opening.
  useEffect(() => {
    const node = element;
    if (!presence.mounted() || node === undefined) return;
    // A viewport measures the open content; report it while it is the open one.
    if (isOpen()) context.setActiveContent(node);
    if (!isOpen() || context.openedBy() !== "keyboard") return;
    getTabbables(node)[0]?.focus();
  });
  onCleanup(() => {
    if (element !== undefined && context.activeContent() === element)
      context.setActiveContent(undefined);
  });

  const merged = mergeElementProps(
    {
      get id() {
        return context.contentId(item.value);
      },
      get "aria-labelledby"() {
        return context.triggerId(item.value);
      },
      get "data-state"() {
        return isOpen() ? "open" : "closed";
      },
      get "data-orientation"() {
        return context.orientation();
      },
      ref: (node: HTMLElement) => {
        element = node;
        presence.ref(node);
        // A viewport renders the content after this component ran, so the element is reported here.
        if (isOpen()) context.setActiveContent(node);
      },
    },
    rest,
  );
  const panel = () => <Polymorphic as={own.as ?? "div"} {...merged} />;
  // With a viewport, the viewport renders the open content (built in this owner, so contexts above
  // the content still reach it); without one the content stays inline.
  const owner = getOwner();
  const build = (): JsxChild => runWithOwner(owner, panel) as JsxChild;
  useEffect(() => {
    if (context.viewport() === undefined || !presence.mounted()) return;
    context.host(build);
    onCleanup(() => context.host(undefined, build));
  });
  return whileMounted(presence.mounted, () => (
    <>{context.viewport() === undefined ? panel() : null}</>
  ));
}

/**
 * Own props of {@link NavigationMenuLink}, on top of the attributes of the `a` element.
 *
 * Accessibility: `active` sets `aria-current="page"`, marking the link as the current page. Clicking
 * the link closes the menu. Data attributes: none.
 * @since 1.0.0
 * @see {@link NavigationMenuLink}
 */
export interface NavigationMenuLinkOwnProps {
  /**
   * Marks the link as the page the user is on: sets `aria-current="page"`.
   * @default false
   */
  readonly active?: boolean | undefined;
}

/**
 * Props of {@link NavigationMenuLink}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link NavigationMenuLinkOwnProps}
 */
export type NavigationMenuLinkProps<T extends PolymorphicTarget = "a"> = PolymorphicProps<
  "a",
  NavigationMenuLinkOwnProps,
  T
>;

/**
 * A link inside a content. A click closes the menu (unless the click handler calls
 * `preventDefault()`). Keyboard use is the native link behavior: Enter follows it.
 *
 * @param props See {@link NavigationMenuLinkProps}.
 * @returns The `a` element.
 * @throws Error when rendered outside {@link NavigationMenuRoot}.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function DocsLink() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="docs">
 *           <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/docs" active>Docs home</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuLinkOwnProps}
 */
export function NavigationMenuLink<T extends PolymorphicTarget = "a">(
  props: NavigationMenuLinkProps<T>,
): JsxChild {
  const context = navigationMenuContext.use("NavigationMenu.Link");
  const [own, rest] = splitProps(partProps<Loose & NavigationMenuLinkOwnProps>(props), [
    "as",
    "active",
    "onClick",
  ]);
  const merged = mergeElementProps(
    {
      get "aria-current"() {
        return own.active === true ? "page" : undefined;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => context.open(undefined, "click"),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "a"} {...merged} />;
}
