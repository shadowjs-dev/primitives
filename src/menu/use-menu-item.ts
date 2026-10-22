import { type Accessor, onCleanup, untrack, useEffect, useSignal } from "@shadow-js/core";
import { type MenuContentContextValue, type MenuItemData, menuContentContext } from "./context";

/**
 * What an item part tells the shared item behavior.
 * @internal
 * @since 1.0.0
 * @see {@link useMenuItem}
 */
export interface MenuItemOptions {
  /**
   * The part's name for the "must be used within" message.
   * @default none (required)
   */
  readonly part: string;
  /**
   * Whether the item is disabled. Tracked.
   * @default none (required)
   */
  readonly disabled: () => boolean;
  /**
   * The text typeahead matches; the element's text when omitted.
   * @default none (the element's trimmed text content)
   */
  readonly textValue: () => string | undefined;
}

/**
 * The shared item behavior.
 * @internal
 * @since 1.0.0
 * @see {@link useMenuItem}
 */
export interface MenuItemBinding {
  readonly element: Accessor<HTMLElement | undefined>;
  readonly content: MenuContentContextValue;
  /** Element props: `ref`, `tabindex`, `aria-disabled`, `data-disabled`, `data-highlighted` and the pointer/focus handlers. */
  readonly props: Record<string, unknown>;
}

/**
 * What every menu item has in common (items, checkbox and radio items, submenu triggers): it
 * registers with its content for keyboard navigation and typeahead, is highlighted by focus, takes
 * focus when the mouse moves over it (not when it merely rests under a pointer that is not moving,
 * so the keyboard and a stationary pointer do not fight), and gives focus back to the content when
 * the pointer leaves it.
 *
 * @param options See {@link MenuItemOptions}.
 * @returns The element and the props to merge into it.
 * @internal
 * @since 1.0.0
 * @see {@link MenuItem}
 */
export function useMenuItem(options: MenuItemOptions): MenuItemBinding {
  const content = menuContentContext.use(options.part);
  const [element, setElement] = useSignal<HTMLElement | undefined>(undefined);
  const [highlighted, setHighlighted] = useSignal(false);

  useEffect(() => {
    const node = element();
    if (node === undefined) return;
    const data: MenuItemData = {
      textValue: () => options.textValue() ?? node.textContent?.trim() ?? "",
      disabled: options.disabled,
    };
    onCleanup(content.items.register(node, data));
  });

  const props: Record<string, unknown> = {
    ref: (node: HTMLElement): void => {
      setElement(node);
    },
    tabindex: -1,
    get "aria-disabled"() {
      return options.disabled() ? "true" : undefined;
    },
    get "data-disabled"() {
      return options.disabled() ? "" : undefined;
    },
    get "data-highlighted"() {
      return highlighted() ? "" : undefined;
    },
    // focusin/focusout are delegated: no per-item native listener to clean up.
    onFocusIn: (): void => {
      setHighlighted(true);
    },
    onFocusOut: (): void => {
      setHighlighted(false);
    },
    onMouseDown: (event: MouseEvent): void => {
      // A disabled item must not take focus from the item that has it.
      if (untrack(options.disabled)) event.preventDefault();
    },
    onPointerMove: (event: PointerEvent): void => {
      if (event.pointerType !== "mouse") return;
      const node = untrack(element);
      if (node === undefined) return;
      if (untrack(options.disabled)) {
        content.focusContent();
        return;
      }
      if (content.isPointerMovingToSubmenu(event)) return;
      if (node.ownerDocument.activeElement !== node) node.focus({ preventScroll: true });
    },
    onPointerLeave: (event: PointerEvent): void => {
      if (event.pointerType !== "mouse") return;
      if (content.isPointerMovingToSubmenu(event)) return;
      // Traveling into a submenu rendered elsewhere is not leaving the menu.
      if (content.isInSubmenu(event.relatedTarget instanceof Node ? event.relatedTarget : null))
        return;
      content.focusContent();
    },
  };
  return { element, content, props };
}
