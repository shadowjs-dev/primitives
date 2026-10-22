import { onCleanup, splitProps, untrack, useEffect, useSignal } from "@shadow-js/core";
import { Portal, Show } from "@shadow-js/web";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { PopperContent, type PopperContentOwnProps } from "../popper/index";
import { LooseDismissableLayer } from "../utils/dismissable-layer";
import {
  callHandler,
  composeRefs,
  createTypeahead,
  type FocusOutsideEvent,
  hideOthers,
  lockScroll,
  mergeElementProps,
  type PointerDownOutsideEvent,
  type PolymorphicProps,
  type PolymorphicTarget,
  useFocusScope,
  usePresence,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type SelectContentContextValue, selectContentContext, selectContext } from "./context";
import { getInitialSelectIndex, getSelectScrollDelta, getSelectTarget } from "./logic";
import { whileMounted } from "./mounted";
import { selectPortalContext } from "./portal";

/**
 * Own props of {@link SelectContent}: the placement options of `PopperContent` plus the dismissal
 * and focus hooks.
 *
 * Accessibility: the listbox is `role="listbox"` with `aria-orientation="vertical"`. It takes focus
 * on open (the selected item, else the first enabled one). ArrowDown, ArrowUp, Home, End, PageDown
 * and PageUp move focus; Enter and Space select; Escape closes (`onEscapeKeyDown` can keep it open);
 * Tab closes without selecting. Focus returns to the trigger on close (`onCloseAutoFocus` can prevent
 * that).
 *
 * Data attributes: `data-state` (`open` | `closed`), `data-side` and `data-align` from the placement,
 * and `dir`.
 * @see {@link SelectContent}
 * @see {@link Select}
 * @since 1.0.0
 */
export interface SelectContentOwnProps extends PopperContentOwnProps {
  /**
   * Keep the listbox mounted while closed (for animation libraries).
   * @default `false`
   */
  readonly forceMount?: boolean | undefined;
  /**
   * Focus is about to return to the trigger. `preventDefault()` to focus something yourself.
   * @default none
   */
  readonly onCloseAutoFocus?: ((event: Event) => void) | undefined;
  /**
   * Escape was pressed. `preventDefault()` keeps the listbox open.
   * @default none
   */
  readonly onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /**
   * A pointer press happened outside the listbox. `preventDefault()` keeps it open.
   * @default none
   */
  readonly onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
}

/**
 * Props of {@link SelectContent}.
 * @see {@link SelectContent}
 * @see {@link Select}
 * @since 1.0.0
 */
export type SelectContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  SelectContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "forceMount",
  "onCloseAutoFocus",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "children",
] as const;

const NAVIGATION_KEYS: readonly string[] = [
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageDown",
  "PageUp",
];

/**
 * The listbox: `role="listbox"`, placed against the trigger by `PopperContent` (below it,
 * start-aligned, flipping and shifting to stay in view). The selected item is not aligned over the
 * trigger. Size it with the CSS variables of the positioning engine:
 * `min-width: var(--primitives-anchor-width)` is applied by default (the listbox is at least as
 * wide as the trigger) and `Select.Viewport` is bounded by `var(--primitives-available-height)`.
 *
 * While open it is modal: focus is trapped and moves to the selected item (or the first enabled
 * one), page scroll is locked, the rest of the page is hidden from assistive technology and pointer
 * events outside are blocked. ArrowDown / ArrowUp / Home / End / PageDown / PageUp move focus (no
 * wrapping), Enter and Space select the focused item, typing jumps to the next item starting with
 * the typed text, Escape closes, and Tab closes without selecting. Focus returns to the trigger on
 * close. The listbox stays mounted until its exit animation ends.
 *
 * While closed, the children are rendered into a detached element (never visible, never in the
 * page's accessibility tree) so items can register their text for `Select.Value`, the closed
 * trigger's typeahead and the native form control. This means the children of `Select.Content` run
 * once while closed and once more each time it opens.
 *
 * @param props See {@link SelectContentProps}.
 * @returns The open listbox, plus the detached registry of items while it is closed.
 * @throws When rendered outside a `Select` root.
 * @example
 * import { Select } from "@shadow-js/primitives";
 *
 * <Select>
 *   <Select.Content sideOffset={4} class="listbox">
 *     <Select.Viewport>
 *       <Select.Item value="apple"><Select.ItemText>Apple</Select.ItemText></Select.Item>
 *     </Select.Viewport>
 *   </Select.Content>
 * </Select>;
 * @see {@link SelectContentOwnProps}
 * @see {@link SelectPortal}
 * @since 1.0.0
 */
export function SelectContent<T extends PolymorphicTarget = "div">(
  props: SelectContentProps<T>,
): JsxChild {
  const context = selectContext.use("Select.Content");
  const [own, rest] = splitProps(partProps<Loose & SelectContentOwnProps>(props), OWN_KEYS);
  const presence = usePresence(() => context.open() || own.forceMount === true);
  let host: HTMLElement | undefined;
  /** The off-screen home of the closed listbox's items. */
  const registryHost = (): HTMLElement => {
    if (host === undefined) {
      host = document.createElement("div");
      host.hidden = true;
    }
    return host;
  };
  const portal = selectPortalContext.useOptional();
  // The portal is opened together with the listbox, so the listbox is the last child of the
  // container: a portal that existed from the start would sit before a dialog opened later, and the
  // listbox would be painted under its overlay.
  const listbox = whileMounted(presence.mounted, () =>
    portal === undefined ? (
      <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
    ) : (
      <Portal mount={portal.container}>
        <ContentLayer own={own} rest={rest} presenceRef={presence.ref} />
      </Portal>
    ),
  );
  return (
    <>
      {listbox}
      <Show when={context.settled() && !presence.mounted()}>
        <Portal mount={registryHost}>{own["children"] as JsxChild}</Portal>
      </Show>
    </>
  );
}

interface ContentLayerProps {
  readonly own: Loose & SelectContentOwnProps;
  readonly rest: object;
  readonly presenceRef: (element: HTMLElement) => void;
}

/** The options of a listbox in document order, read from the DOM (works before items register). */
function optionElements(content: HTMLElement): HTMLElement[] {
  return [...content.querySelectorAll<HTMLElement>('[role="option"]')];
}

/** The mounted part of the content: everything here lives exactly as long as the element. */
function ContentLayer(layer: ContentLayerProps): JsxChild {
  const context = selectContext.use("Select.Content");
  const { own } = layer;
  const [node, setNode] = useSignal<HTMLElement | undefined>(undefined);
  const [viewport, setViewport] = useSignal<HTMLElement | undefined>(undefined);
  const typeahead = createTypeahead();

  /** Moves focus to an item and brings it into view inside the scroll container, never the page. */
  const focusItem = (item: HTMLElement): void => {
    item.focus({ preventScroll: true });
    const content = untrack(node);
    const scroller = untrack(viewport) ?? content;
    if (scroller === undefined) return;
    const options = content === undefined ? [] : optionElements(content);
    // The first and last item reveal the padding and group labels around them, as Radix does.
    if (options[0] === item) {
      scroller.scrollTop = 0;
      return;
    }
    if (options.at(-1) === item) {
      scroller.scrollTop = scroller.scrollHeight;
      return;
    }
    const view = scroller.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    const delta = getSelectScrollDelta(box.top, box.bottom, view.top, view.bottom);
    // The rectangles are in screen pixels, `scrollTop` in the scroller's own: they differ while the
    // entrance animation scales the listbox.
    const scale =
      scroller.offsetHeight > 0 && view.height > 0 ? view.height / scroller.offsetHeight : 1;
    if (delta !== 0) scroller.scrollTop += delta / scale;
  };

  /**
   * Scrolls the focused option into view again, once the viewport has its final height. The scroll
   * buttons appear after the first scroll and take room from the viewport, so it is done once more
   * on the next frame (scroll events are dispatched before the frame's callbacks run).
   */
  let revealFrame: { readonly view: Window; readonly id: number } | undefined;
  onCleanup(() => revealFrame?.view.cancelAnimationFrame(revealFrame.id));
  const revealFocusedItem = (): void => {
    // The item-aligned content measures once the listbox has a placement.
    context.afterPlaced?.();
    const reveal = (): void => {
      const content = untrack(node);
      const active = content?.ownerDocument.activeElement;
      if (active instanceof HTMLElement && content?.contains(active) === true) {
        if (active.getAttribute("role") === "option") focusItem(active);
      }
    };
    reveal();
    const view = untrack(node)?.ownerDocument.defaultView;
    if (view === null || view === undefined || typeof view.requestAnimationFrame !== "function") {
      return;
    }
    revealFrame?.view.cancelAnimationFrame(revealFrame.id);
    revealFrame = { view, id: view.requestAnimationFrame(reveal) };
  };

  /** The items of this listbox (not the closed-state registry copies) in document order. */
  const listItems = () => {
    const content = untrack(node);
    return context.collection.getItems().filter((item) => content?.contains(item.element) === true);
  };

  const focusInitial = (): void => {
    const content = untrack(node);
    if (content === undefined) return;
    const options = optionElements(content);
    const index = getInitialSelectIndex(
      options.map((option) => option.hasAttribute("data-disabled")),
      options.findIndex((option) => option.getAttribute("aria-selected") === "true"),
    );
    const target = index === undefined ? undefined : options[index];
    if (target === undefined) content.focus({ preventScroll: true });
    else focusItem(target);
  };

  const search = (key: string): void => {
    const items = listItems();
    const active = untrack(node)?.ownerDocument.activeElement;
    const index = typeahead.handleKey(
      key,
      items.map((item) => ({ value: item.data.textValue, disabled: item.data.disabled })),
      items.findIndex((item) => item.element === active),
    );
    const match = index === undefined ? undefined : items[index];
    if (match !== undefined) focusItem(match.element);
  };

  const navigate = (key: string): void => {
    const items = listItems();
    const active = untrack(node)?.ownerDocument.activeElement;
    const index = getSelectTarget({
      key,
      disabled: items.map((item) => item.data.disabled),
      current: items.findIndex((item) => item.element === active),
    });
    const target = index === undefined ? undefined : items[index];
    if (target !== undefined) focusItem(target.element);
  };

  // Modal side effects live as long as the content is mounted, so the page does not jump while it
  // fades out. Content kept mounted by `forceMount` while closed must not lock the page.
  const modal = (): boolean => context.open() || own.forceMount !== true;
  useEffect(() => {
    if (!modal()) return;
    onCleanup(lockScroll());
  });

  // Like a native select, the listbox closes when the window loses focus or is resized.
  useEffect(() => {
    const view = node()?.ownerDocument.defaultView;
    if (view === null || view === undefined || !context.open()) return;
    const close = (): void => context.setOpen(false);
    view.addEventListener("blur", close);
    view.addEventListener("resize", close);
    onCleanup(() => {
      view.removeEventListener("blur", close);
      view.removeEventListener("resize", close);
    });
  });

  // Press on the trigger, drag onto an item, release: selects it. A release that stayed within a
  // few pixels of the press is the end of the click that opened the listbox and must not select.
  useEffect(() => {
    const element = node();
    const origin = context.pointerOrigin.current;
    if (element === undefined || origin === undefined || !context.open()) return;
    const document = element.ownerDocument;
    let moved = { x: 0, y: 0 };
    const onMove = (event: PointerEvent): void => {
      moved = {
        x: Math.abs(Math.round(event.clientX) - origin.x),
        y: Math.abs(Math.round(event.clientY) - origin.y),
      };
    };
    const stop = (): void => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp, true);
    };
    const onUp = (event: PointerEvent): void => {
      if (moved.x <= 10 && moved.y <= 10) event.preventDefault();
      else if (!(event.target instanceof Node && element.contains(event.target))) {
        untrack(() => context.setOpen(false));
      }
      context.pointerOrigin.current = undefined;
      stop();
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, true);
    onCleanup(stop);
  });

  useFocusScope({
    container: node,
    onActivated: (element) => (modal() ? hideOthers(element) : undefined),
    trapped: () => true,
    loop: () => true,
    enabled: context.open,
    onMountAutoFocus: () => (event) => {
      // Not the first tabbable: the selected item (or the first enabled one) takes focus.
      event.preventDefault();
      focusInitial();
    },
    onUnmountAutoFocus: () => (event) => {
      callHandler(own.onCloseAutoFocus, event);
      if (event.defaultPrevented) return;
      // Safari does not focus buttons on click, so the browser's own "previous focus" can be body.
      event.preventDefault();
      const trigger = untrack(context.trigger);
      if (trigger?.isConnected === true) trigger.focus({ preventScroll: true });
    },
  });
  const contentContext: SelectContentContextValue = {
    content: node,
    viewport,
    setViewport: (element) => setViewport(() => element),
    onItemLeave: () => untrack(node)?.focus({ preventScroll: true }),
    isTypingAhead: () => typeahead.search() !== "",
    focusItem,
  };

  const elementProps = mergeElementProps(
    {
      get id() {
        return context.contentId();
      },
      role: "listbox",
      "aria-orientation": "vertical",
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      tabindex: -1,
      // Placement defaults; the application's props (in `rest`) override them.
      side: "bottom",
      align: "start",
      collisionPadding: 10,
      get dir() {
        return context.dir();
      },
      get style() {
        return {
          "min-width": "var(--primitives-anchor-width)",
          "box-sizing": "border-box",
          outline: "none",
          direction: context.dir(),
          // A column, so the viewport shrinks to what the scroll buttons leave: without it the
          // listbox itself would scroll as well, a second scrollbar around the first.
          display: "flex",
          "flex-direction": "column",
        };
      },
      onKeyDown: (event: KeyboardEvent) => {
        const modifier = event.ctrlKey || event.altKey || event.metaKey;
        if (event.key === "Tab") {
          // Focus stays where the user left it in the page's order: back on the trigger.
          event.preventDefault();
          context.setOpen(false);
          return;
        }
        if (!modifier) search(event.key);
        if (NAVIGATION_KEYS.includes(event.key)) {
          event.preventDefault();
          navigate(event.key);
        }
      },
      onContextMenu: (event: MouseEvent) => event.preventDefault(),
    },
    layer.rest,
    { ref: composeRefs<HTMLElement>(layer.presenceRef, (element) => setNode(element)) },
  );

  return (
    <selectContentContext.Provider value={contentContext}>
      <PopperContent
        as={LayerElement}
        layerAs={own.as ?? "div"}
        {...elementProps}
        enabled={context.open()}
        disableOutsidePointerEvents={true}
        branches={() => [context.trigger()]}
        onEscapeKeyDown={(event: KeyboardEvent) => callHandler(own.onEscapeKeyDown, event)}
        onPointerDownOutside={(event: PointerDownOutsideEvent) =>
          callHandler(own.onPointerDownOutside, event)
        }
        // The viewport only gets its height once the content is placed, so an item focused on
        // opening (the selected one) is brought into view then.
        onPlaced={revealFocusedItem}
        // The focus trap owns focus while the listbox is open.
        onFocusOutside={(event: FocusOutsideEvent) => event.preventDefault()}
        onDismiss={() => context.setOpen(false)}
      >
        {own["children"] as JsxChild}
      </PopperContent>
    </selectContentContext.Provider>
  );
}

/** `PopperContent` builds its element through `as`; the application's own `as` travels as `layerAs`. */
function LayerElement(props: Record<string, unknown>): JsxChild {
  const [own, rest] = splitProps(props as Loose & { readonly layerAs?: PolymorphicTarget }, [
    "layerAs",
  ]);
  const Layer = LooseDismissableLayer;
  return <Layer as={own.layerAs ?? "div"} {...rest} />;
}
