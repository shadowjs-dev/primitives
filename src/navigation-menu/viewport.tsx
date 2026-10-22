import { onCleanup, splitProps, untrack, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { navigationMenuContext } from "./context";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * Props of {@link NavigationMenuViewport}: the attributes of the `div`.
 * @since 1.0.0
 * @see {@link NavigationMenuViewport}
 */
export type NavigationMenuViewportProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * The shared panel that hosts the open item's content, so the flyout can grow and shrink between
 * items instead of each content floating on its own. Render it once inside {@link NavigationMenuRoot},
 * usually after the list. While it is rendered, every `NavigationMenu.Content` renders inside it.
 *
 * Renders a `div` with `data-state` (`"open"` while an item is open, else `"closed"`), `data-orientation`
 * and `dir`. It publishes the size of the open content as the CSS variables
 * `--primitives-navigation-menu-viewport-width` and `--primitives-navigation-menu-viewport-height`
 * (in pixels), measured again when the open item changes and when the content resizes, so the panel
 * can animate its size. In a right-to-left menu the `dir` attribute is `rtl`.
 *
 * @param props See {@link NavigationMenuViewportProps}.
 * @returns The `div` element that hosts the open content.
 * @throws Error when rendered outside {@link NavigationMenuRoot}.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function SiteNav() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="docs">
 *           <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/docs">All docs</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *       <NavigationMenu.Viewport style={{ width: "var(--primitives-navigation-menu-viewport-width)" }} />
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuContent}
 */
export function NavigationMenuViewport<T extends PolymorphicTarget = "div">(
  props: NavigationMenuViewportProps<T>,
): JsxChild {
  const context = navigationMenuContext.use("NavigationMenu.Viewport");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  let element: HTMLElement | undefined;

  const measure = (): void => {
    const host = element;
    if (host === undefined) return;
    const content = untrack(context.activeContent);
    if (content === undefined || untrack(context.value) === undefined) return;
    const box = content.getBoundingClientRect();
    host.style.setProperty("--primitives-navigation-menu-viewport-width", `${box.width}px`);
    host.style.setProperty("--primitives-navigation-menu-viewport-height", `${box.height}px`);
  };

  // Measure the open content when the open item (and so its content) changes.
  useEffect(() => {
    context.value();
    context.activeContent();
    measure();
  });
  // And when the content itself changes size.
  useEffect(() => {
    const content = context.activeContent();
    if (content === undefined || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    onCleanup(() => observer.disconnect());
  });

  const merged = mergeElementProps(
    {
      get "data-state"() {
        return context.value() === undefined ? "closed" : "open";
      },
      get "data-orientation"() {
        return context.orientation();
      },
      get dir() {
        return context.dir();
      },
      ref: (node: HTMLElement) => {
        element = node;
        context.setViewport(node);
      },
    },
    rest,
  );
  onCleanup(() => context.setViewport(undefined));
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {context.hosted()?.()}
    </Polymorphic>
  );
}

/**
 * Props of {@link NavigationMenuIndicator}: the attributes of the `div`.
 * @since 1.0.0
 * @see {@link NavigationMenuIndicator}
 */
export type NavigationMenuIndicatorProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * A marker that follows the open item's trigger, for an underline or an arrow under the active
 * item. Render it inside {@link NavigationMenuList} (the list should be positioned) or anywhere in
 * the root.
 *
 * Renders a `div` with `data-state` (`"visible"` while an item is open, else `"hidden"`) and
 * `data-orientation`. It publishes the trigger's offset from the start edge of the menu and its size
 * along the menu's axis as `--primitives-navigation-menu-indicator-position` and
 * `--primitives-navigation-menu-indicator-size` (in pixels). In a horizontal menu the offset counts
 * from the left edge, or from the right edge in a right-to-left menu; in a vertical menu it counts
 * from the top. It is `aria-hidden`: it carries no information a screen reader needs.
 *
 * @param props See {@link NavigationMenuIndicatorProps}.
 * @returns The `div` element.
 * @throws Error when rendered outside {@link NavigationMenuRoot}.
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function UnderlinedNav() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List style={{ position: "relative" }}>
 *         <NavigationMenu.Item value="docs">
 *           <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/docs">All docs</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *         <NavigationMenu.Indicator
 *           style={{
 *             position: "absolute",
 *             bottom: 0,
 *             insetInlineStart: "var(--primitives-navigation-menu-indicator-position)",
 *             width: "var(--primitives-navigation-menu-indicator-size)",
 *             height: "2px",
 *           }}
 *         />
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuTrigger}
 */
export function NavigationMenuIndicator<T extends PolymorphicTarget = "div">(
  props: NavigationMenuIndicatorProps<T>,
): JsxChild {
  const context = navigationMenuContext.use("NavigationMenu.Indicator");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  let element: HTMLElement | undefined;

  const measure = (): void => {
    const host = element;
    const root = untrack(context.rootElement);
    const current = untrack(context.value);
    if (host === undefined || root === undefined || current === undefined) return;
    const trigger = context.triggerElement(current);
    if (trigger === undefined) return;
    const menu = root.getBoundingClientRect();
    const box = trigger.getBoundingClientRect();
    const vertical = untrack(context.orientation) === "vertical";
    const position = vertical
      ? box.top - menu.top
      : untrack(context.dir) === "rtl"
        ? menu.right - box.right
        : box.left - menu.left;
    host.style.setProperty("--primitives-navigation-menu-indicator-position", `${position}px`);
    host.style.setProperty(
      "--primitives-navigation-menu-indicator-size",
      `${vertical ? box.height : box.width}px`,
    );
  };

  useEffect(() => {
    context.value();
    context.orientation();
    context.dir();
    context.rootElement();
    measure();
  });
  useEffect(() => {
    const root = context.rootElement();
    if (root === undefined || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    onCleanup(() => observer.disconnect());
  });

  const merged = mergeElementProps(
    {
      "aria-hidden": true,
      get "data-state"() {
        return context.value() === undefined ? "hidden" : "visible";
      },
      get "data-orientation"() {
        return context.orientation();
      },
      ref: (node: HTMLElement) => {
        element = node;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
