/**
 * What the navigation menu root shares with its lists, items, triggers and content. @internal
 */
import type { Accessor } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createPartContext,
  type Direction,
  type Orientation,
  type PartContext,
  type RovingFocus,
} from "../utils/index";

/**
 * What opened the open item, so the content knows whether to move focus into itself. @internal
 * @see {@link NavigationMenu}
 */
export type NavigationOpenedBy = "pointer" | "keyboard" | "click";

/**
 * What a navigation menu part reads and does: the open item, how it was opened, the delays and the registrations.
 * @see {@link NavigationMenu}
 * @since 1.0.0
 */
export interface NavigationMenuContextValue {
  /** The open item's value, or undefined when every item is closed. Tracked. */
  readonly value: Accessor<string | undefined>;
  /** Opens `value`, or closes everything with `undefined`. */
  readonly open: (value: string | undefined, by: NavigationOpenedBy) => void;
  readonly openedBy: Accessor<NavigationOpenedBy | undefined>;
  readonly delay: () => number;
  readonly orientation: Accessor<Orientation>;
  readonly dir: Accessor<Direction>;
  readonly roving: RovingFocus;
  readonly triggerId: (value: string) => string;
  readonly contentId: (value: string) => string;
  /** Remembers a trigger's element so focus can return to it. */
  readonly registerTrigger: (value: string, element: HTMLElement | undefined) => void;
  /** Focuses the trigger of `value`, if mounted. */
  readonly focusTrigger: (value: string) => void;
  /** The trigger element of `value`, if mounted. Not tracked: read it when `value` changes. */
  readonly triggerElement: (value: string) => HTMLElement | undefined;
  /** The `nav` root element once mounted. Tracked. */
  readonly rootElement: Accessor<HTMLElement | undefined>;
  /** The viewport element, when a `NavigationMenu.Viewport` is rendered. Tracked. */
  readonly viewport: Accessor<HTMLElement | undefined>;
  readonly setViewport: (element: HTMLElement | undefined) => void;
  /** Builds the open content for the viewport to render, in the content's own owner. Tracked. */
  readonly hosted: Accessor<(() => JsxChild) | undefined>;
  /** Offers a builder to the viewport; returns nothing. Offering `undefined` for the same builder withdraws it. */
  readonly host: (build: (() => JsxChild) | undefined, previous?: () => JsxChild) => void;
  /** The element of the open content, reported by the content itself. Tracked. */
  readonly activeContent: Accessor<HTMLElement | undefined>;
  readonly setActiveContent: (element: HTMLElement | undefined) => void;
  /** Starts a timer that runs `fn` after the hover delay; canceled by `cancelTimer`. */
  readonly scheduleOpen: (fn: () => void) => void;
  readonly cancelTimer: () => void;
}

/**
 * The context a `NavigationMenu` root provides to its parts. Read it in a custom part rendered inside the
 * root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own; the
 * built-in parts use it to keep their roles, labels and focus in step.
 *
 * @example
 * import { navigationMenuContext } from "@shadow-js/primitives";
 *
 * export function State() {
 *   const root = navigationMenuContext.use("State");
 *   return <span>{root.value() ?? "closed"}</span>;
 * }
 * @see {@link NavigationMenu}
 * @since 1.0.0
 */
export const navigationMenuContext: PartContext<NavigationMenuContextValue> =
  createPartContext<NavigationMenuContextValue>("NavigationMenu");

/**
 * What an item shares with its trigger and content: its value.
 * @see {@link NavigationMenu}
 * @since 1.0.0
 */
export interface NavigationMenuItemContextValue {
  readonly value: string;
}

/**
 * The context a `NavigationMenu` item provides to its trigger and content. Read it in a custom part rendered inside an
 * item; reading it anywhere else throws.
 *
 * @example
 * import { navigationMenuItemContext } from "@shadow-js/primitives";
 *
 * export function ItemName() {
 *   const item = navigationMenuItemContext.use("ItemName");
 *   return <span>{item.value}</span>;
 * }
 * @see {@link NavigationMenu}
 * @since 1.0.0
 */
export const navigationMenuItemContext: PartContext<NavigationMenuItemContextValue> =
  createPartContext<NavigationMenuItemContextValue>("NavigationMenu.Item");
