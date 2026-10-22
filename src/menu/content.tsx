import { onCleanup, onMount, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperContent, type PopperContentOwnProps } from "../popper/index";
import {
  callHandler,
  composeRefs,
  createCollection,
  createRevealer,
  createTypeahead,
  type FocusOutsideEvent,
  getRovingTarget,
  hideOthers,
  lockScroll,
  mergeElementProps,
  type PointerDownOutsideEvent,
  type PolymorphicProps,
  type PolymorphicTarget,
  scrollIntoScroller,
  useFocusScope,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import {
  type GraceIntent,
  type MenuContentContextValue,
  type MenuEntry,
  type MenuItemData,
  menuContentContext,
  menuContext,
  menuRootContext,
} from "./context";
import { isPointerHeadingToSubmenu, isPointInSafePolygon, type SubmenuSide } from "./intent";
import { MenuLayerElement } from "./layer-element";
import { whileMounted } from "./mounted";

/** How long the pointer may rest inside the safe area before the submenu gives up waiting for it. */
const GRACE_MS = 300;

/**
 * Props of {@link MenuPortal}. The portal renders no element of its own and sets no ARIA or data
 * attributes: the content inside it carries the menu's `role="menu"` and `data-state` (see
 * {@link MenuContentOwnProps}).
 * @since 1.0.0
 * @see {@link MenuPortal}
 */
export interface MenuPortalProps {
  /**
   * Where to render the menu. Accepts an element, `null`, or a function that returns one.
   * @default document.body
   */
  readonly container?: Element | null | (() => Element | null | undefined);
  /**
   * Keep the content mounted while closed (for animation libraries that control mounting).
   * @default false
   */
  readonly forceMount?: boolean | undefined;
  /**
   * The content to portal. Usually one `Menu.Content`.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/** The element to render into: the application's container, or the body. */
function resolveContainer(container: MenuPortalProps["container"]): Element | null | undefined {
  if (container === undefined) return document.body;
  return typeof container === "function" ? container() : container;
}

/**
 * Renders the content into `document.body` (or `container`) while the menu is open, and keeps it
 * there until its exit animation has finished. It handles no keys and sets no ARIA attributes of
 * its own. Renders nothing on the server: put the content directly inside the root when it has to
 * be part of the server markup.
 *
 * @param props See {@link MenuPortalProps}.
 * @returns The portal, or nothing while the menu is closed and not held.
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function PortaledMenu() {
 *   const [open, setOpen] = useSignal(false);
 *   return (
 *     <Menu open={open()} onOpenChange={setOpen}>
 *       <Menu.Anchor>Actions</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content>
 *           <Menu.Item onSelect={() => setOpen(false)}>Save</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuContent}
 * @since 1.0.0
 */
export function MenuPortal(props: MenuPortalProps): JsxChild {
  const menu = menuContext.use("Menu.Portal");
  return (
    <Show when={menu.open() || menu.held() || props.forceMount === true}>
      <Portal mount={() => resolveContainer(props.container)}>{props.children}</Portal>
    </Show>
  );
}

/**
 * Own props of {@link MenuContent}: the placement options of `PopperContent` (inherited, such as
 * `side`, `sideOffset` and `align`) plus the focus and dismissal hooks.
 *
 * Accessibility: the content is `role="menu"` with `aria-orientation="vertical"`, `tabindex="-1"`,
 * and `aria-labelledby` pointing at its trigger while the trigger is mounted. Arrow keys, Home, End,
 * PageUp, PageDown and typeahead move between the items; Escape closes the menu (or the submenu it
 * belongs to), and Tab closes it. The focus and dismissal hooks can veto or redirect that behavior
 * when they call `preventDefault()`.
 *
 * Data attributes: `data-state` (`open` or `closed`), `data-orientation="vertical"`, and `dir`
 * (the resolved direction). `PopperContent` adds `data-side` and `data-align`.
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export interface MenuContentOwnProps extends PopperContentOwnProps {
  /**
   * Keep the content mounted while closed (for animation libraries).
   * @default false
   */
  readonly forceMount?: boolean | undefined;
  /**
   * Arrow keys wrap from the last item to the first and back.
   * @default false
   */
  readonly loop?: boolean | undefined;
  /**
   * Focus is about to move into the menu. `preventDefault()` to focus something yourself.
   * @default none (focus moves to the first item when opened by the keyboard, otherwise to the content)
   */
  readonly onOpenAutoFocus?: ((event: Event) => void) | undefined;
  /**
   * Focus is about to return to the trigger. `preventDefault()` to focus something yourself.
   * @default none (focus returns to the trigger)
   */
  readonly onCloseAutoFocus?: ((event: Event) => void) | undefined;
  /**
   * Escape was pressed. `preventDefault()` keeps the menu open.
   * @default none
   */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * A pointer press happened outside the menu. `preventDefault()` keeps it open.
   * @default none
   */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /**
   * Focus moved outside the menu. `preventDefault()` keeps it open.
   * @default none
   */
  readonly onFocusOutside?: ((event: FocusOutsideEvent) => void) | undefined;
  /**
   * Pointer press or focus outside. `preventDefault()` keeps the menu open.
   * @default none
   */
  readonly onInteractOutside?:
    | ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void)
    | undefined;
}

/**
 * Props of {@link MenuContent}.
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export type MenuContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MenuContentOwnProps,
  T
>;

/**
 * The props as the implementation sees them. Internal: used by the shared content layer.
 * @internal
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export type MenuLoose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The own props the content reads itself; everything else (placement, attributes) passes through.
 * Internal: used by `MenuContent` and `MenuSubContent` to split their props.
 * @internal
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export const MENU_CONTENT_OWN_KEYS = [
  "as",
  "forceMount",
  "loop",
  "onOpenAutoFocus",
  "onCloseAutoFocus",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onFocusOutside",
  "onInteractOutside",
  "children",
] as const;

/**
 * The menu panel: `role="menu"` with `aria-orientation="vertical"`, labeled by its trigger, placed
 * against its anchor by `PopperContent`. Keys: ArrowDown and ArrowUp move between enabled items
 * (wrapping with `loop`), Home, End, PageUp and PageDown jump to the ends, printable keys run
 * typeahead, Escape and an outside press close it, and Tab closes it. Focus returns to the trigger
 * when the menu closes (or to the element that had focus before it opened, when there is none).
 *
 * Focus moves in on open: to the first item when opened by the keyboard, otherwise to the menu
 * itself. A modal menu (the default) also hides the rest of the page from assistive technology,
 * locks scroll and blocks pointer events outside. The content stays mounted until its exit
 * animation ends, and the positioning CSS variables (such as `--primitives-available-height`) are
 * available to it.
 *
 * @param props See {@link MenuContentProps}.
 * @returns The menu element, or nothing while the content is not mounted.
 * @example
 * import { useSignal } from "@shadow-js/core";
 * import { Menu } from "@shadow-js/primitives/menu";
 *
 * function ActionsMenu() {
 *   const [open, setOpen] = useSignal(false);
 *   return (
 *     <Menu open={open()} onOpenChange={setOpen}>
 *       <Menu.Anchor>Actions</Menu.Anchor>
 *       <Menu.Portal>
 *         <Menu.Content sideOffset={4} loop>
 *           <Menu.Item onSelect={() => setOpen(false)}>Save</Menu.Item>
 *         </Menu.Content>
 *       </Menu.Portal>
 *     </Menu>
 *   );
 * }
 * @see {@link MenuContentOwnProps}
 * @since 1.0.0
 */
export function MenuContent<T extends PolymorphicTarget = "div">(
  props: MenuContentProps<T>,
): JsxChild {
  const menu = menuContext.use("Menu.Content");
  const [own, rest] = splitProps(
    partProps<MenuLoose & MenuContentOwnProps>(props),
    MENU_CONTENT_OWN_KEYS,
  );
  const presence = usePresence(() => menu.open() || own.forceMount === true);
  return whileMounted(presence.mounted, () => (
    <MenuContentLayer kind="root" own={own} rest={rest} presenceRef={presence.ref} />
  ));
}

/**
 * What the mounted layer needs from the part that renders it.
 * @internal
 * @since 1.0.0
 * @see {@link MenuContentLayer}
 */
export interface MenuContentLayerProps {
  /** The root menu's content or a submenu's. */
  readonly kind: "root" | "sub";
  readonly own: MenuLoose & MenuContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The pixel value of a computed padding, or 0. */
function pixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * The mounted part of the content: everything here lives exactly as long as the element.
 *
 * @param layer See {@link MenuContentLayerProps}.
 * @returns The content element, placed by `PopperContent`.
 * @internal
 * @since 1.0.0
 * @see {@link MenuContent}
 */
export function MenuContentLayer(layer: MenuContentLayerProps): JsxChild {
  const menu = menuContext.use("Menu.Content");
  const root = menuRootContext.use("Menu.Content");
  const isRoot = layer.kind === "root";
  // Only a submenu has a parent content to report to.
  const parentContent = isRoot ? undefined : menuContentContext.useOptional();
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  const [padding, setPadding] = useSignal(0);
  const items = createCollection<MenuItemData>();
  const typeahead = createTypeahead();
  const children = new Set<HTMLElement>();
  // Set by an outside interaction: focus then belongs to whatever the user picked, not the trigger.
  let interactedOutside = false;
  // A submenu closed with the keyboard hands focus back to its trigger.
  let focusTriggerOnClose = false;
  let grace: GraceIntent | null = null;
  let graceTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerX = 0;
  let pointerDirection: SubmenuSide | null = null;

  const endGrace = (): void => {
    if (graceTimer !== undefined) clearTimeout(graceTimer);
    graceTimer = undefined;
  };
  const startGrace = (): void => {
    endGrace();
    graceTimer = setTimeout(() => {
      graceTimer = undefined;
      const expired = grace;
      grace = null;
      expired?.onExpire();
    }, GRACE_MS);
  };
  onCleanup(endGrace);

  /** Focuses an item without scrolling the page, then brings it into view inside the menu. */
  const focusItem = (element: HTMLElement): void => {
    element.focus({ preventScroll: true });
    const content = untrack(node);
    if (content !== undefined) scrollIntoScroller(content, element);
  };
  /** The menu is only as tall as its scroll area once it has been placed: reveal the focused item then. */
  const revealer = createRevealer(() => {
    const content = untrack(node);
    const active = content?.ownerDocument.activeElement;
    if (!(active instanceof HTMLElement) || content === undefined || active === content) {
      return undefined;
    }
    // An item of this menu, not of a submenu rendered inside it.
    if (!content.contains(active) || active.closest('[role="menu"]') !== content) return undefined;
    return { scroller: content, item: active };
  });
  onCleanup(revealer.cancel);

  // Items register after the content mounts; an entry that needs them waits for the first batch.
  let pendingEntry: MenuEntry | undefined;
  const focusEntry = (entry: MenuEntry): void => {
    if (entry !== "content") {
      const enabled = items.getItems().filter((item) => !item.data.disabled());
      const target = entry === "first" ? enabled[0] : enabled.at(-1);
      if (target !== undefined) {
        pendingEntry = undefined;
        focusItem(target.element);
        return;
      }
      pendingEntry = entry;
      // Only the registrations of this very flush count; later items must not take focus.
      queueMicrotask(() => {
        pendingEntry = undefined;
      });
    }
    untrack(node)?.focus({ preventScroll: true });
  };
  useEffect(() => {
    // Tracked read: runs again when items register.
    if (items.items().length === 0) return;
    const entry = pendingEntry;
    if (entry !== undefined) untrack(() => focusEntry(entry));
  });
  onMount(() => {
    menu.focuser.current = focusEntry;
    const release = menu.hold();
    return () => {
      release();
      menu.focuser.current = undefined;
      menu.setContent(undefined);
    };
  });
  // A submenu is part of its parent for "is the pointer leaving the menu" questions.
  useEffect(() => {
    const element = node();
    if (element === undefined || parentContent === undefined) return;
    onCleanup(parentContent.registerChild(element));
  });
  // Padding compensation: the first item of a submenu lines up with its trigger.
  onMount(() => {
    const element = untrack(node);
    if (element === undefined || isRoot) return;
    const view = element.ownerDocument.defaultView ?? globalThis;
    setPadding(pixels(view.getComputedStyle(element).paddingTop));
  });
  useEffect(() => {
    const element = node();
    if (element !== undefined) element.setAttribute("dir", root.dir());
  });
  // Modal side effects live as long as the content is mounted, so the page does not jump while it fades out.
  useEffect(() => {
    if (!isRoot || !root.modal()) return;
    onCleanup(lockScroll());
  });

  useFocusScope({
    container: node,
    onActivated: (element) => (isRoot && root.modal() ? hideOthers(element) : undefined),
    trapped: () => isRoot && root.modal(),
    loop: () => false,
    enabled: () => menu.open(),
    onMountAutoFocus: () => (event) => {
      callHandler(own.onOpenAutoFocus, event);
      if (event.defaultPrevented) return;
      // The scope would focus the first tabbable; menu items are never tabbable, so decide here.
      event.preventDefault();
      const requested = menu.entry.value;
      menu.entry.value = undefined;
      if (isRoot) focusEntry(requested ?? (root.isKeyboard() ? "first" : "content"));
      // A submenu opened with the pointer keeps focus on its trigger.
      else if (requested !== undefined) focusEntry(requested);
    },
    onUnmountAutoFocus: () => (event) => {
      callHandler(own.onCloseAutoFocus, event);
      if (event.defaultPrevented) {
        interactedOutside = false;
        return;
      }
      if (!isRoot) {
        // The submenu closes because focus moved to a sibling, or the keyboard asked: focus is ours to place.
        event.preventDefault();
        if (focusTriggerOnClose) {
          focusTriggerOnClose = false;
          const trigger = untrack(menu.trigger);
          if (trigger?.isConnected === true) trigger.focus();
        }
        return;
      }
      if (interactedOutside) {
        interactedOutside = false;
        event.preventDefault();
        return;
      }
      // Safari does not focus buttons on click, so the browser's own "previous focus" can be body.
      const trigger = untrack(menu.trigger);
      if (trigger?.isConnected === true) {
        event.preventDefault();
        trigger.focus();
      }
    },
  });

  const isInSubmenu = (target: Node | null): boolean => {
    if (target === null) return false;
    for (const child of children) if (child.contains(target)) return true;
    return false;
  };
  const isMovingToSubmenu = (event: PointerEvent): boolean =>
    isPointerHeadingToSubmenu(
      { x: event.clientX, y: event.clientY },
      grace?.area ?? null,
      pointerDirection,
    );
  const contentContextValue: MenuContentContextValue = {
    items,
    content: node,
    typeahead,
    dir: root.dir,
    focusContent: () => untrack(node)?.focus({ preventScroll: true }),
    isPointerMovingToSubmenu: isMovingToSubmenu,
    setGrace(intent) {
      grace = intent;
      if (intent === null) endGrace();
      else startGrace();
    },
    registerChild(element) {
      children.add(element);
      return () => {
        children.delete(element);
      };
    },
    isInSubmenu,
  };

  const textOf = (item: { element: HTMLElement; data: MenuItemData }): string =>
    item.data.textValue();

  const onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    const element = event.currentTarget;
    // Keys from a submenu rendered inside this content belong to that submenu.
    if (!(target instanceof Element) || !(element instanceof Element)) return;
    if (target.closest('[role="menu"]') !== element) return;
    if (event.key === "Tab") {
      event.preventDefault();
      root.close();
      return;
    }
    if (!isRoot) {
      const closeKey = root.dir() === "rtl" ? "ArrowRight" : "ArrowLeft";
      if (event.key === closeKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        menu.setOpen(false);
        // Focus is moved by hand: the close hook leaves it alone so a sibling can keep it.
        untrack(menu.trigger)?.focus();
        return;
      }
    }
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const all = items.getItems();
    const current = all.findIndex((item) => item.element === element.ownerDocument.activeElement);
    if (event.key.length === 1) {
      const next = typeahead.handleKey(
        event.key,
        all.map((item) => ({ value: textOf(item), disabled: item.data.disabled() })),
        current,
      );
      if (next !== undefined) {
        event.preventDefault();
        const match = all[next];
        if (match !== undefined) focusItem(match.element);
      }
      return;
    }
    if (event.shiftKey) return;
    const next = getRovingTarget({
      key: event.key,
      orientation: "vertical",
      dir: root.dir(),
      loop: own.loop === true,
      disabled: all.map((item) => item.data.disabled()),
      current,
    });
    if (next === undefined) return;
    event.preventDefault();
    all[next]?.element.focus();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse") return;
    const target = event.target;
    const element = untrack(node);
    if (element !== undefined && target instanceof Node && element.contains(target)) {
      if (event.clientX !== pointerX) {
        pointerDirection = event.clientX > pointerX ? "right" : "left";
        pointerX = event.clientX;
      }
    }
    // A pointer still traveling toward the submenu keeps the grace period alive until it stops.
    if (
      grace !== null &&
      isPointInSafePolygon({ x: event.clientX, y: event.clientY }, grace.area.polygon)
    ) {
      startGrace();
    }
  };

  const elementProps = mergeElementProps(
    {
      get id() {
        return menu.contentId();
      },
      role: "menu",
      "aria-orientation": "vertical",
      get "aria-labelledby"() {
        return menu.triggerPart.present() ? menu.triggerId() : undefined;
      },
      get "data-state"() {
        return menu.open() ? "open" : "closed";
      },
      "data-orientation": "vertical",
      tabindex: -1,
      style: { outline: "none" },
      onKeyDown,
      onPointerMove,
      onFocusOut: (event: FocusEvent) => {
        const element = untrack(node);
        if (element === undefined) return;
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !element.contains(next)) typeahead.reset();
      },
      ...(isRoot ? {} : { onPointerEnter: () => parentContent?.setGrace(null) }),
    },
    isRoot
      ? undefined
      : {
          get side() {
            return root.dir() === "rtl" ? "left" : "right";
          },
          align: "start",
          get alignOffset() {
            return -padding();
          },
        },
    layer.rest,
    {
      ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => {
        setNode(element);
        menu.setContent(element);
      }),
    },
  );

  return (
    <PopperContent
      as={MenuLayerElement}
      layerAs={own.as ?? "div"}
      dir={root.dir()}
      {...elementProps}
      enabled={menu.open()}
      onPlaced={revealer.reveal}
      disableOutsidePointerEvents={isRoot && root.modal()}
      branches={() => [menu.trigger()]}
      onEscapeKeyDown={(event: KeyboardEvent) => {
        callHandler(own.onEscapeKeyDown, event);
        if (!event.defaultPrevented && !isRoot) focusTriggerOnClose = true;
      }}
      onPointerDownOutside={(event: PointerDownOutsideEvent) => {
        callHandler(own.onPointerDownOutside, event);
      }}
      onFocusOutside={(event: FocusOutsideEvent) => {
        callHandler(own.onFocusOutside, event);
        // The focus trap owns focus in a modal menu.
        if (isRoot && root.modal()) event.preventDefault();
      }}
      onInteractOutside={(event: PointerDownOutsideEvent | FocusOutsideEvent) => {
        callHandler(own.onInteractOutside, event);
        if (event.defaultPrevented) return;
        const original = event.detail.originalEvent;
        const rightClick =
          original instanceof PointerEvent &&
          (original.button === 2 || (original.button === 0 && original.ctrlKey));
        // Pressing elsewhere in a non-modal menu (or right-clicking away from a modal one) leaves focus on what the user chose.
        if (!root.modal() || rightClick) interactedOutside = true;
      }}
      onDismiss={() => menu.setOpen(false)}
    >
      <menuContentContext.Provider value={contentContextValue}>
        {own["children"] as JsxChild}
      </menuContentContext.Provider>
    </PopperContent>
  );
}
